(ns magic-button.core
  (:require
   [clojure.java.io :as io]
   [compojure.core :refer [defroutes GET POST PUT routes context]]
   [ring.middleware.defaults :refer [wrap-defaults site-defaults]]
   [ring.util.response :refer [response]]
   [ring.adapter.jetty :refer [run-jetty]]
   [libpython-clj2.require :refer [require-python]]
   [libpython-clj2.python :refer [py. py.. py.-] :as py]))


(py/initialize! :python-executable "env/bin/python3.8"
                :library-path "env/lib/python3.8/site-packages")


(def atbl (py/import-module "pyairtable"))


(def AIRTABLE_API_KEY
  (System/getenv "AIRTABLE_API_KEY"))


(def AIRTABLE_BASE_ID
  "appjfkhe1V3bMZt40")


(def api
  (py/call-attr atbl "Api" AIRTABLE_API_KEY))


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


(comment
 (get-tables))


(defn save-cv-record [table-id user-id cv-file]
  (let [table   (py/call-attr api "table" AIRTABLE_BASE_ID table-id)
        profile {"Name" "name"}]
    ;;:status             "status"
    ;;:photo              "photo"
    ;;:location           "location"
    ;;:age                "age"
    ;;:experience         "experience"
    ;;:clojure-experience "clojure-experience"
    ;;:english-level      "english-level"
    ;;:telegram           "telegram"
    ;;:email              "email"
    ;;:resume-link        "resume-link"
    ;;:resume-file        "resume-file"
    ;;:created-date       "created-date"}]
    (py/call-attr table "create" profile)))

(comment
 (-> (py/call-attr api "table" AIRTABLE_BASE_ID "tblk4HruAUjHdPCbH")
     (py/call-attr "schema")
     (py/->jvm))

 (-> (py/call-attr api "table" AIRTABLE_BASE_ID "tblk4HruAUjHdPCbH")
     (py/call-attr "create" {"Name" "Sergey"}))

 (save-cv-record "tblk4HruAUjHdPCbH" "user-id" (io/file "resources" "cv.pdf")))


(defroutes app-routes
  (context "/api/v1" []
    (routes
     ;; route for retrieving the list of available airtable tables
     (GET "/get-tables" []
       (response (get-tables)))

     ;; route to accept a PDF file
     (POST "/:table-id/:user-id/cv" {{:keys [file table-id user-id]} :params}
       (let [{tempfile :tempfile filename :filename} file
             cv-file (io/file "resources" filename)]
         (io/copy tempfile cv-file)
         (save-cv-record table-id user-id cv-file)
         (response "OK"))))))


(defn -main [& args]
  (let [config (assoc-in site-defaults [:security :anti-forgery] false)]
    (-> (wrap-defaults #'app-routes config)
        (run-jetty {:port  3000
                    :join? false}))))


(comment
 (def server
   (-main))

 (.stop server))