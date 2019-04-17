#!/usr/bin/env python

import sys
import json
import struct 
sys.path.insert(0,"/anaconda2/lib/python2.7/site-packages")
import praw
from collections import Counter
import spacy
import en_core_web_md
nlp = en_core_web_md.load()
#nlp = spacy.load('en_core_web_md')
#nlpCoref = spacy.load('en_coref_md');
#numpy/pandas
from scipy import sparse
from scipy.spatial.distance import cdist
import numpy as np

STOP_WORDS = ["reddit", "http", "https", "www", "com", "html"]

#from https://github.com/mdn/webextensions-examples/tree/master/native-messaging
def getMessage():
    rawLength = sys.stdin.read(4)
    if len(rawLength) == 0:
        sys.exit(0)
    messageLength = struct.unpack('@I', rawLength)[0]
    message = sys.stdin.read(messageLength)
    return json.loads(message)

# Encode a message for transmission,
# given its content.
def encodeMessage(messageContent):
    encodedContent = json.dumps(messageContent)
    encodedLength = struct.pack('@I', len(encodedContent))
    return {'length': encodedLength, 'content': encodedContent}

# Send an encoded message to stdout
def sendMessage(encodedMessage):
    sys.stdout.write(encodedMessage['length'])
    sys.stdout.write(encodedMessage['content'])
    sys.stdout.flush()    

def extract_topics(post_id):

    def vectorizeText(text, vectorizer):
        vector_data = vectorizer.fit_transform(text)
        return sparse.csr_matrix(vector_data/post_lengths).todense(),\
            np.array(vectorizer.get_feature_names())

    #credentials
    CLIENT_ID = "r-9Wl_lxYBj5-Q"
    CLIENT_SECRET = None
    REDIRECT_URI = 'http://localhost:8080'
    USER_AGENT = "MacOSX:Topical for Reddit:v1.0 (by /u/thereistonsonenotany)"

    #API call
    reddit = praw.Reddit(client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        redirect_uri=REDIRECT_URI,
        user_agent=USER_AGENT)

    submission = reddit.submission(id=post_id)
    submission.comment_sort = 'best'
    submission.comments.replace_more(limit=None)

    #BUILD DATA STRUCTURES/HELPER VARIABLES
    comments = [{"id":x.id, "text":x.body, "score":x.score,\
        "num_comments":len(x.replies.list()), "parent_id":x.parent_id[3:]} #parent ids start with t1_\
    for x in submission.comments.list()\
        if not x.stickied and len(x.body)>30 and x.body != "[deleted]"]

    mean_length = sum([len(x["text"]) for x in comments])/len(comments)
    post_lengths = np.array([1.*len(x["text"])/mean_length for x in comments])[:,None]                       

    MNBcleanedcomments = []
    OOVcleanedcomments = []
    vectors = []
    vector_map = {}
    for comment in comments:
        cleaned_text_list = [word for word in comment['text'].split(" ") if word not in nlp.Defaults.stop_words]
        text=nlp(" ".join(cleaned_text_list) if len(cleaned_text_list) > 0 else comment["text"])
        vector_map[comment["id"]] = text.vector  
        MNBcleanedcomments.append(" ".join([token.lemma_ for token in text\
                                                if not token.is_punct and not token.is_stop\
                                                and token.lemma_ != '-PRON-' \
                                                and token.lemma_ not in STOP_WORDS\
                                                and (token.pos_ in ['NOUN', 'ADJ', 'VERB', 'ADV']\
                                                    or token.ent_type != '')
                                            ])
        )
        OOVcleanedcomments.append(" ".join([token.lemma_ for token in text\
                                                if not token.is_punct\
                                                and not token.is_stop\
                                                and token.is_oov]) 
        )

    for comment in comments:
        if comment["parent_id"] in vector_map:
            vector_plus_parent = (2.*vector_map[comment["id"]] + vector_map[comment["parent_id"]])/3.
            vectors.append(vector_plus_parent)
            vector_map[comment["id"]] = vector_plus_parent
        else:
            vectors.append(vector_map[comment["id"]])

    # Materialize the sparse data
    oov_vectors, oov_feature_names = vectorizeText(OOVcleanedcomments, 
                                        TfidfVectorizer(analyzer='word',
                                            min_df=0.005,
                                            lowercase=True,
                                            stop_words=STOP_WORDS,
                                            token_pattern='[a-zA-Z]{3,}'
                                   )
    )

    vectors = np.concatenate((np.array(vectors), oov_vectors), axis=1)
    distances = cdist(vectors, vectors, "euclidean")*-1.

    sendMessage(encodeMessage(list(oov_feature_names)))

    #CLUSTERING
    max_comments = max([c["num_comments"] for c in comments])
    '''preferences = [p/(3. if (comments[i]["num_comments"]/max_comments) >= 0.7 else 1.)\
        for i,p in enumerate(list(np.median(distances, axis=1)))]'''
    preferences = np.median(distances, axis=1)
    clusters = AffinityPropagation(affinity="precomputed", preference=preferences).fit(distances)
    clusters_by_size = Counter(clusters.labels_).most_common()
    cluster_rename_dict = {clusters_by_size[i][0]:i for i in range(len(clusters_by_size))}
    fixed_clusters = [cluster_rename_dict[x] for x in clusters.labels_]
    cluster_counter = Counter(fixed_clusters)
    n_clusters = len(cluster_counter)

    mnb_vectors, feature_names = vectorizeText(MNBcleanedcomments, TfidfVectorizer(analyzer='word',
                                    min_df=0.005,
                                    max_df=0.2,
                                    lowercase=True,
                                    stop_words=STOP_WORDS,
                                    token_pattern='[a-zA-Z]{3,}'
                                   )
    )

    #MNB classifier to get important features per cluster
    n_terms_per_cluster=5
    clfMNB = LogisticRegression()
    clfMNB.fit(mnb_vectors, fixed_clusters)
    cluster_terms = []
    for i, label in enumerate(["Topic "+str(x) for x in range(n_clusters)]):
        topTermLocs = np.argsort(clfMNB.coef_[i])[-n_terms_per_cluster:]
        topTerms = ", ".join(feature_names[topTermLocs])
        cluster_terms.append ({
            "topic_num":str(i),
            "terms":topTerms,
            "num_posts":cluster_counter[i]
            })

    posts = [{"id": x["id"], "topic_num":fixed_clusters[i]}\
    for i,x in enumerate(comments)]
    
    return {'posts':posts,
            'topics': cluster_terms
            }    

while True:
    try:
        from sklearn.linear_model import LogisticRegression
        from sklearn.cluster import AffinityPropagation
        from sklearn.feature_extraction.text import TfidfVectorizer
    except Exception as e:
        #squelch this
        pass 
    receivedMessage = getMessage()
    try:
        output_data = extract_topics(receivedMessage["post_id"])
    except Exception as e:
        sendMessage(encodeMessage(str(e)))
    sendMessage(encodeMessage(output_data))



