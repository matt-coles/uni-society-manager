var event_controller = require("./../../presenters/event-controller.js");

module.exports = {
  perform: function (a,b) {
    perform(a,b);
  }
}

var perform = function (req, res) {
  var auth = req.body.auth || req.query.auth;

  if (auth) {
    event_controller.get_all_accepted_events(auth, function (response) {
      res.send(response);
    });
  } else {
    res.send({
      "accepted_events": [],
      "error": 2
    });
  }
};
