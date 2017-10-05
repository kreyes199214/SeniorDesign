define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/topic",
    "dojo/request",
    "dijit/form/TextBox",
    "dijit/form/ValidationTextBox",
    "bootstrap/Modal",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    "dojo/query",
    "dojo/dom",
    "dojo/dom-construct",
    "jpl/config/Config",
    "jpl/events/ToolEvent",
    "jpl/events/BrowserEvent",
    "jpl/dijit/ui/RegisterInputDialog",
    'dojo/text!../templates/UserLogin.html',
    "xstyle/css!./../css/Tool.css"
], function (declare, lang, on, topic, request, TextBox, ValidationTextBox, Modal, _WidgetBase, _TemplatedMixin, query, dom,
             domConstruct, Config, ToolEvent, BrowserEvent, RegisterInputDialog, template) {
return declare([_WidgetBase, _TemplatedMixin], {

    templateString: template,
    widgetsInTemplate: true,
    config: null,
    username: null,
    password: null,
    token: null,
    enterKeyListener: null,

    constructor: function () {
      this.inherited(arguments);
    },

    postCreate: function () {
      on(this.btnLogin, "click", lang.hitch(this, this.doLogin));
      on(this.loginModalClose, "click", lang.hitch(this, this.modalCleanup));
      on(this.registerLink, "click", lang.hitch(this, this.doRegister));
    },

    startup: function () {
      this.config = Config.getInstance();
      query(this.loginInputDialog).modal();
      this.modalTitle.innerHTML = "<b>" + this.config.data.title  + " Login</b>";

      this.username = new dijit.form.TextBox({
        id: "userLoginUsername",
        value: "",
        //readOnly: true,
        placeHolder: "enter username",
        style: "width: 250px;"
      }, "userLoginUsername");
      this.username.startup();
      this.username.textbox.style.textAlign = 'left'; 

      this.password = new ValidationTextBox({
        id: "userLoginPassword",
        type: "password",
        placeHolder: "enter password",
        style: "width: 250px;"
      }, "userLoginPassword");
      this.password.startup();
      this.password.textbox.style.textAlign = 'left';

      this.enterKeyListener = on(this.password, "keyup", lang.hitch(this, this.doKeyUp));
    },

    doKeyUp: function(evt)
    {
      if (evt.key == 'Enter')
      {
        this.btnLogin.click();
      }
    },

    doLogin: function (evt) {
        //console.log('doLogin');
        var url = this.config.ldapService + "/authenticate";
        if (url == undefined) {
            topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
                title: 'Login',
                content: 'No LDAP was defined in the configuration',
                size: 'sm'
            });
        }
        var uname = this.username.get('value');
        var passwd = this.password.get('value');

        var xhr = new XMLHttpRequest();
        xhr.open('POST', url, false);
        xhr.setRequestHeader("X-OpenAM-Username", uname);
        xhr.setRequestHeader("X-OpenAM-Password", passwd);

        xhr.send();
        if (xhr.status === 200) {
            // do something to response
            var reponseJson = JSON.parse(xhr.responseText);
            dom.byId('loginToken').innerHTML = reponseJson.tokenId;
            this.token = reponseJson.tokenId;
            console.log('doToolSelect():: this.token = ' + this.token);
            // var exdays = 1;
            // var d = new Date();
            // d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
            //
            // var expires = "expires="+d.toUTCString();
            // document.cookie = "iPlanetDirectoryPro=" + reponseJson.tokenId + ";" + expires + ";path=.nasa.gov";

            this.username.destroyRecursive();
            this.password.destroyRecursive();

            topic.publish(ToolEvent.prototype.LOGIN_TOOL, this.token, uname, passwd);

        } else {
            dom.byId('loginToken').innerHTML = 'ERROR';
            this.username.destroyRecursive();
            this.password.destroyRecursive();
            topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
                title: 'Login Error',
                content: 'Invalid username or password',
                size: 'sm'
            });
        }

    },

    doLogout: function()
    {
      console.log('doLogout()');

      this.username.destroyRecursive();
      this.password.destroyRecursive();
      this.enterKeyListener.remove();

      var url = this.config.ldapService + "/sessions/?_action=logout";
      if (url == undefined) 
      {
        topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
          title: 'Log out',
          content: 'No LDAP was defined in the configuration',       
          size: 'sm'
        });
      }

      var xhr = new XMLHttpRequest();
      xhr.open('POST', url, false);
      xhr.setRequestHeader('iPlanetDirectoryPro', this.token);
      xhr.send();

      if (xhr.status === 200) 
      {
        var reponseJson = JSON.parse(xhr.responseText);
        console.log('doLogout():: reponseJson = ' + reponseJson);
        //topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
        //  title: 'Logout',
        //  content: 'You are logged out',
        //  size: 'sm'
        //});
      } 
      else 
      {
        //topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
        //  title: 'Logout Error',
        //  content: 'Invalid username or password',
        //  size: 'sm'
        //});
      }
    },

    modalCleanup: function(evt)
    {
      this.username.destroyRecursive();
      this.password.destroyRecursive();
    },
 
    doRegister: function()
    {
      var self = this;
      self.loginModalClose.click();
      var register = new RegisterInputDialog();
      register.startup();
    }

  });
});
