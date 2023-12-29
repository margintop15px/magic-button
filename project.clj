(defproject magic-button "0.1.0-SNAPSHOT"
  :description "Suppa magic button"

  :dependencies [[org.clojure/clojure "1.11.1"]
                 [compojure "1.6.3"]
                 [ring/ring-defaults "0.4.0"]
                 [ring/ring-json "0.5.1"]
                 [ring/ring-jetty-adapter "1.9.6"]
                 [clj-http "3.12.3"]
                 [clj-python/libpython-clj "2.025"]
                 [net.clojars.wkok/openai-clojure "0.14.0"]]

  :repl-options {:init-ns magic-button.core}
  :main magic-button.core/server)
