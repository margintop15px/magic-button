# magic-button

### Setup

```shell
pyenv install 3.8 
virtualenv -p ~/.pyenv/versions/3.8.18/bin/python env

source env/bin/activate
# for fish:
source env/bin/activate.fish

pip install -r requirements.txt
```

### Run

Setup AIRTABLE_API_KEY env variable

```shell
lein run
(-main)
```

```shell
curl http://localhost:3000/api/v1/get-tables
```