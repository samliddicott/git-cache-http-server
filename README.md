A caching Git HTTP server
============================

Mirror remote repositories and serve them over HTTP, automatically updating
them as needed.

Currently supported client operations are fetch and clone.  Authentication to
the upstream repository is always enforced (for now, only HTTP Basic is
supported), but public repositories can be used as well.

# Usage

```
Usage:
  git-cache-http-server.js [options]

Options:
  -c,--cache-dir <path>   Location of the git cache [default: /var/cache/git]
  -p,--port <port>        Bind to port [default: 8080]
  -h,--help               Print this message
  --version               Print the current version
```

The upstream remote is extracted from the URL, taking the first component as
the remote hostname.

Example:

```
$ git-cache-http-server --port 1234 --cache-dir /tmp/cache/git &
$ git clone http://localhost:1234/github.com/jonasmalacofilho/git-cache-http-server
```

# Installing

Requirements: `nodejs` and `git`.

Install: `npm install -g jonasmalacofilho/git-cache-http-server`

To install as a service, check the `doc/git-cache-http-server.service` example
service file.

For Systemd init users, this file should not require major tweaks other than
specifying a different than default port number or cache directory.  After
installed in the proper Systemd unit path for your distribution, issue:

```
systemctl daemon-reload
systemctl start git-cache-http-server
```

# Implementation

The current implementation is somewhat oversimplified; any help in improving it
is greatly appreciated!

References:

 - [Transfer protocols on the Git Book](http://git-scm.com/book/en/v2/Git-Internals-Transfer-Protocols)
 - [Git documentation on the HTTP transfer protocols](https://github.com/git/git/blob/master/Documentation/technical/http-protocol.txt)
 - [Source code for the GitLab workhorse](https://gitlab.com/gitlab-org/gitlab-workhorse/blob/master/handlers.go)
 - [Source code for `git-http-backend`](https://github.com/git/git/blob/master/http-backend.c)
