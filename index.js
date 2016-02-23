var express = require('express');
var app = express();
var bcrypt = require('bcrypt-nodejs');
var Redis = require('ioredis');
var redis = new Redis();
var bodyParser = require('body-parser');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.get('/hello/(:name)?', function (req, res) {
    var name = req.params.name || "World";
    res.send('Hello ' + name + "!");
});

app.all('/register', function(req, res) {
    var tmp_username = req.body.user || req.query.user;
    var tmp_password = req.body.password || req.query.password;
    var uquery       = 'user:' + tmp_username;
    var user_object  = {};

    redis.get(uquery).then(function (result) {
        if (result !== "" && result !== undefined && result !== null) {
            res.send({"registered": 0,
                     "error": 1});
        } else {
            bcrypt.hash(tmp_password, null, null, function (err, hash) {
                user_object["password"] = hash;
                user_object["auth-key"] = bcrypt.hashSync(Date.now().toString() + tmp_username);
                redis.set(uquery, JSON.stringify(user_object));
                res.send({"registered": 1,
                         "auth-key": user_object["auth-key"],
                         "error": 0});
            });
        }
    });
});

app.all('/login', function(req, res) {
    var username = req.body.user || req.query.user;
    var password = req.body.password || req.query.password;
    var auth_key = req.body.auth_key || req.query.auth_key;
    var uquery   = 'user:' + username;

    redis.get(uquery).then(function (result) {
        if (result !== "" && result !== undefined && result !== null) {
            var user_object = JSON.parse(result);
            if (auth_key !== "" && auth_key !== undefined && auth_key !== null) {
                if (auth_key === user_object["auth-key"]) {
                    var timestamp_user = Date.now().toString() + username;
                    user_object["auth-key"] = bcrypt.hashSync(timestamp_user);
                    redis.set(uquery, JSON.stringify(user_object));
                    res.send({"logged_in": 1,
                             "auth-key": user_object["auth-key"],
                             "error": 0});
                } else {
                    res.send({"logged_in": 0,
                             "error": 3});
                }
            } else {
                bcrypt.compare(password, user_object["password"], function (err, matched) {
                    if (matched === true) {
                        if (undefined === user_object["auth-key"]) {
                            var timestamp_user = Date.now().toString() + username;
                            user_object["auth-key"] = bcrypt.hashSync(timestamp_user);
                            redis.set(uquery, JSON.stringify(user_object));
                            res.send({"logged_in": 1,
                                     "auth-key": user_object["auth-key"],
                                     "error": 0});
                        } else {
                            res.send({"logged_in": 1,
                                     "auth-key": user_object["auth-key"],
                                     "error": 0});
                        }
                        return;
                    } else {
                        res.send({"logged_in": 0,
                                 "error": 2});
                                 return;
                    }
                });

            }
        } else {
            res.send({"logged_in": 0,
                     "error": 1});
                     return;
        }
    });
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

process.on('SIGINT', function() {
    console.log( "\nRecieved Ctrl-C, shutting down." );
    process.exit(0);
})