# magic-button

### Setup

```shell
curl https://pyenv.run | bash
Возможно придется сделать руками
в ~/.bashrc
добавить
export PYENV_ROOT="$HOME/.pyenv"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"

pyenv install 3.8 

pipx install virtualenv

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

curl -XPOST -F file=@docs/Profile.pdf http://localhost:3000/api/v1/me/cv
```