#!/usr/bin/env python

import sys
import json
import struct 
sys.path.insert(0,"/anaconda2/lib/python2.7/site-packages")
import praw
from collections import Counter
import spacy
#adapted from https://medium.com/@pmin91/aspect-based-opinion-mining-nlp-with-python-a53eb4752800
nlp = spacy.load('en_core_web_md')
#nlpCoref = spacy.load('en_coref_md');
#numpy/pandas
from scipy import sparse
import numpy as np

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

    #sendMessage(encodeMessage("start topic extraction"))
    with open('credentials.json') as json_data:
        credentials = json.load(json_data)

    #pull Reddit data
    CLIENT_ID = credentials["CLIENT_ID"]
    CLIENT_SECRET = credentials["CLIENT_SECRET"]
    USER_AGENT = credentials["USER_AGENT"]
    NUM_TOP_LEVEL_COMMENTS = 500
    MAX_DEPTH = 15

    reddit = praw.Reddit(client_id=CLIENT_ID,
                         client_secret=CLIENT_SECRET,
                         user_agent=USER_AGENT)
    submission = reddit.submission(id=post_id) #'7zbrzm' - CNN guns '6baefh' - Berlin vis, '9mzk4o' - climate change
    submission.comment_sort = 'controversial'
    submission.comments.replace_more(limit=None)

    #sendMessage(encodeMessage("data loaded"))

    flat_comments = [{"id":x.id, "text":x.body, "score":x.score}\
    for x in submission.comments.list()]

    score_threshold = np.percentile(np.array([x["score"] if 'score' in x.keys() else 0 for x in flat_comments]), 75)
    '''comments = [x for x in flat_comments\
                         if (len(x["text"]) > 100\
                          or x["score"] >=score_threshold)\
                        and not (x["text"] == "[deleted]")\
                        and len(x["text"]) > 50]'''
    comments = [x for x in flat_comments]

    MNBcleanedcomments = []
    HACmaxvectors = []
    #sendMessage(encodeMessage("comment loop"))
    for comment in comments:

        #comment['text_pronouns_resolved'] = nlpCoref(comment['text'])._.coref_resolved
        #text = nlp(comment['text_pronouns_resolved'] if comment['text_pronouns_resolved'] != '' else comment['text'])
        text=nlp(comment['text'])

        cleaned_tokens = [token for token in text\
        if not token.is_punct and not token.is_stop\
        and token.lemma_ != '-PRON-' \
        and (token.pos_ in ['NOUN', 'ADJ', 'VERB', 'ADV'] or token.ent_type != '')]

        #vectorizer needs a list of strings, one for each post
        MNBcleanedcomments.append(" ".join([token.lemma_ for token in cleaned_tokens]));
        HACmaxvectors.append(np.max(np.array([token.vector/(token.vector_norm or 1.) for token in text\
                                             if not token.is_punct and not token.is_stop]), axis=0)\
                            +\
                            np.min(np.array([token.vector/(token.vector_norm or 1.) for token in text\
                                             if not token.is_punct and not token.is_stop]), axis=0))
    HACmaxvectors = np.array(HACmaxvectors)

    #sendMessage(encodeMessage("start clustering"))
    n_clusters = 6
    n_terms_per_cluster=5
    clusters = AgglomerativeClustering(n_clusters = n_clusters, linkage='complete',\
                                                   affinity='l2' ).fit(HACmaxvectors)
    clusters_by_size = Counter(clusters.labels_).most_common()
    cluster_rename_dict = {clusters_by_size[i][0]:i for i in range(len(clusters_by_size))}
    fixed_clusters = [cluster_rename_dict[x] for x in clusters.labels_]
    cluster_counter = Counter(fixed_clusters)


    #create array with post lengths for adjusting word count vector
    mean_length = sum([len(x["text"]) for x in comments])/len(comments)
    post_lengths = np.array([1.*len(x["text"])/mean_length for x in comments])[:,None]
    #adapted from http://www.machinelearningplus.com/nlp/topic-modeling-python-sklearn-examples/
    MNBvectorizer = CountVectorizer(analyzer='word',
                                    min_df=0.003,
                                    max_df=0.2,
                                    lowercase=True,
                                    stop_words="english",
                                    token_pattern='[a-zA-Z0-9]{3,}',
                                    #ngram_range=(1,2)
                                   )

    data_vectorized = MNBvectorizer.fit_transform(MNBcleanedcomments)
    data_vectorized = data_vectorized/post_lengths
    data_vectorized = sparse.csr_matrix(data_vectorized)

    # Materialize the sparse data
    data_dense = data_vectorized.todense()

    #MNB classifier to get important features per cluster
    feature_names = np.array(MNBvectorizer.get_feature_names())
    clfMNB = MultinomialNB()
    clfMNB.fit(data_dense, fixed_clusters)
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
        from sklearn.naive_bayes import MultinomialNB
        from sklearn.cluster import AgglomerativeClustering
        from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
    except Exception as e:
        #squelch this
        pass
        #sendMessage(encodeMessage(str(e)))      
    receivedMessage = getMessage()
    try:
        output_data = extract_topics(receivedMessage["post_id"])
    except Exception as e:
        sendMessage(encodeMessage(str(e)))
    sendMessage(encodeMessage(output_data))



