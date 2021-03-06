(function() {
  'use strict';

  require('./root.scss');

  var api = require("../../api.js");
  var utils = require("../../utils.js");
  var shared = require("../../shared.js");
  var rocketio = require("../../rocketio.js");

  var components = {
    header:       require("./header/header.js"),
    sidebar:      require("./sidebar/sidebar.js"),
    messageView:  require("./messageView/messageView.js"),
    messageInput: require("./messageInput/messageInput.js")
  };

  var rootComponent = {
    template: require("./root.jade")(),

    components: {
      "va-header":        components.header,
      "va-sidebar":       components.sidebar,
      "va-message-view":  components.messageView,
      "va-message-input": components.messageInput
    },

    data: function() {
      return {
        rooms: [],
        msgListener: null
      };
    },

    created: function() {
      this.listenersSetup();
      console.info("[APP] Root created.");
    },

    ready: function() {
      if (!shared.data.user) {
        shared.jumpers.entrance();
        return;
      }
      this.roomDataSetup(shared.data.currentRoomId);
      console.info("[APP] Root ready.");
    },

    methods: {
      roomDataSetup: function(roomId) {
        this.$broadcast("app:sidebar:setCurrentRoom", roomId);
        this.fetchUsersAndMessages(roomId);
        rocketio.setupRocketIOListeners(this, roomId);
      },

      fetchUsersAndMessages: function(roomId) {
        var _this = this;

        api.getAllRooms().then(function(res) {
          _this.$broadcast("app:sidebar:updateRooms", res.data);
          shared.data.rooms = res.data;
        }, function(res) {
          console.warn("Error at api.getAllRooms");
        });
        api.getRoomUsers(roomId).then(function(res) {
          _this.$broadcast("app:sidebar:updateUsers", res.data);
          shared.data.currentRoomUsers = res.data;
        }, function() {
          console.warn("Error at api.getRoomUsers");
        });
      },

      listenersSetup: function() {
        var _this = this;

        this.$on("app:root:fetchRoomData", function(roomId) {
          _this.roomDataSetup(roomId);
        });
        this.$on("app:root:newMessage", function() {
          _this.$broadcast("app:msgView:scrollBottom");
        });
        this.$on("app:root:roomChange", function() {
          _this.$broadcast("app:msgView:roomChange");
          _this.$broadcast("app:msgInput:setFocus");
        });
      }
    }
  };

  module.exports = rootComponent;
})();
