(ns magic-button.core
  (:require
   [clojure.java.io :as io]
   [clojure.string :as string]
   [compojure.core :refer [defroutes GET POST PUT routes context]]
   [ring.middleware.defaults :refer [wrap-defaults site-defaults]]
   [ring.middleware.json :refer [wrap-json-response wrap-json-params]]
   [ring.util.response :refer [response header status bad-request]]
   [ring.adapter.jetty :refer [run-jetty]]
   [wkok.openai-clojure.api :as open-ai]
   [cheshire.core :as json]
   [libpython-clj2.require :refer [require-python]]
   [libpython-clj2.python.fn :as py.fn]
   [libpython-clj2.python :refer [py. py.. py.-] :as py])
  (:import
   [java.io File]
   [java.time LocalDateTime]
   [java.time.format DateTimeFormatter]
   [java.util Base64 Base64$Decoder]))


(py/initialize! :python-executable "env/bin/python3.8"
                :library-path "env/lib/python3.8/site-packages")


(def atbl (py/import-module "pyairtable"))
(def dl (py/import-module "langchain.document_loaders"))
(def ts (py/import-module "langchain.text_splitter"))
(def embed (py/import-module "langchain.embeddings"))
(def vs (py/import-module "langchain.vectorstores"))
(def llms (py/import-module "langchain.llms"))
(def memory (py/import-module "langchain.memory"))
(def chains (py/import-module "langchain.chains"))

(py/from-import "langchain.vectorstores" FAISS)
(py/from-import "langchain.chains" ConversationalRetrievalChain)


(def AIRTABLE_API_KEY
  (System/getenv "AIRTABLE_API_KEY"))


(def OPENAI_API_KEY
  (System/getenv "OPENAI_API_KEY"))


(def AIRTABLE_BASE_ID
  "appjfkhe1V3bMZt40")


(def api
  (py/call-attr atbl "Api" AIRTABLE_API_KEY))


(defn decode [to-decode]
  (String. (.decode ^Base64$Decoder (Base64/getDecoder) ^String to-decode)
           "UTF-8"))


;; get airtable tables names
(defn get-tables []
  (let [bases       (py/call-attr api "bases")
        target-base (->> bases
                         (filter #(= (py/get-attr % "id") AIRTABLE_BASE_ID))
                         first)
        tables      (py/call-attr target-base "tables")]
    (map #(hash-map :name (py/get-attr % "name")
                    :id (py/get-attr % "id"))
         tables)))


(def prompt-template
  "Summarize the general information from this CV listing.
   For example the person name, last work experience, location where this person is based in, key skills:
   %s
   Return data in the JSON format with only these keys: \"name\", \"location\", \"current-work-experience\", \"education\", \"skills\", \"clojure-experience\".
   \"name\" and \"location\" keys should be strings.
   \"current-work-experience\" key value should be a string containing a company name, position title, tenure, and a short description.
   \"skills\" and \"education\" keys should be a list of strings.
   \"clojure-experience\" key value should be a boolean, and it should answer the question - has this person a Clojure programming experience.")


(defn parse-profile [file-path url]
  (let [document   (-> (py/call-attr dl "BSHTMLLoader" file-path)
                       (py/call-attr "load")
                       first)
        cv-content (->> (py/get-attr document "page_content")
                        (clojure.string/split-lines)
                        (remove #(clojure.string/blank? %))
                        (map clojure.string/trim)
                        (clojure.string/join ". "))
        profile    (-> (open-ai/create-chat-completion
                        {:model    "gpt-3.5-turbo-1106"
                         :messages [{:role "system" :content "You are a helpful assistant."}
                                    {:role "user" :content (format prompt-template cv-content)}]}
                        {:api-key OPENAI_API_KEY})
                       (get-in [:choices 0 :message :content])
                       (json/parse-string keyword))]
    {"Name"               (:name profile)
     "Location"           (:location profile)
     "Work Experience"    (:current-work-experience profile)
     "Clojure Experience" (str (:clojure-experience profile))
     "Skills"             (string/join " | " (:skills profile))
     "Education"          (string/join " | " (:education profile))
     "Created date"       (.format (DateTimeFormatter/ofPattern "yyyy-MM-dd HH:mm:ss") (LocalDateTime/now))
     "Resume"             url}))


(defn save-cv-record [table-id ^File cv-file url]
  (let [table   (py/call-attr api "table" AIRTABLE_BASE_ID table-id)
        profile (parse-profile (.getPath cv-file) url)]
    (py/call-attr table "create" profile)))


(defroutes app-routes
  (context "/api/v1" []
    (routes
     ;; route for retrieving the list of available airtable tables
     (GET "/get-tables" []
       (-> (get-tables)
           (response)
           (header "Content-Type" "application/json")))

     ;; save the candidate profile
     (POST "/:table-id/html" {{:keys [html url table-id]} :params :as params}
       (try
         (let [cv-file (io/file "resources" "cv.html")]
           (if (some? table-id)
             (do (spit cv-file (decode html))
                 (save-cv-record table-id cv-file (decode url))
                 (response "OK"))
             (bad-request "provide a valid table id")))
         (catch Throwable t
           (println t)
           (-> (response {:error (ex-cause t)})
               (status 500))))))))


(defn -main [& args]
  (let [config (assoc-in site-defaults [:security :anti-forgery] false)]
    (-> (wrap-defaults #'app-routes config)
        (wrap-json-params)
        (wrap-json-response)
        (run-jetty {:port  3001
                    :join? false}))))


(comment
 (def server
   (-main))

 (.stop server))