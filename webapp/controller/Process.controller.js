sap.ui.define([
    "./BaseController",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("workflow.approvals.com.kizilay.controller.HelloPanel", {

        onInit: function () {
            this.getRouter().getRoute("process").attachPatternMatched(this._onProcessMatched, this);
        },
        onRefreshPage: function (oEvent) {
            window.location.reload();
        },
        /**
		 * Pattern match for route -> process.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'process'
		 * @private
		 */
        _onProcessMatched: function (oEvent) {
            var sToken = $.sap.getUriParameters().get("token");
            var oAppModel = this.getModel("appModel");
            var that = this;
            console.log("onProcessMatched giriş")
            oAppModel.setProperty("/token", sToken);
            oAppModel.setProperty("/message", {
                "visible": false
            });

            that.openBusyFragment();

            $.ajax({
                url: "./api/validator/" + sToken
            }).done(function (encodedToken, textStatus, jqxhr) {
                console.log("validator bitti")
                that.closeBusyFragment();
                that._handleProcessEvent(sToken, encodedToken);
            }).error(function (jqxhr, textStatus, errorThrown) {
                console.log("validator hatası")
                that.closeBusyFragment();
                oAppModel.setProperty("/message", {
                    "type": "Error",
                    "icon": "sap-icon://error",
                    "text": that.getText("ERROR_OCCURRED"),
                    "description": jqxhr.responseText,
                    "visible": true
                });
            });
        },
        onOpenFiori: function (oEvent) {
            var that = this;
            that.openBusyFragment();
            $.ajax({
                url: "./api/variables"
            }).done(function (data, textStatus, jqxhr) {
                that.closeBusyFragment();
                window.open(data["SAP_FIORI_BASE_URL"] + data["SAP_FIORI_URL"], "_self");
            }).error(function (jqxhr, textStatus, errorThrown) {
                that.closeBusyFragment();
                
            });

            },
        onClosePage: function (oEvent) {
            window.open( "about:blank","_self");
        },
        /**
		 * Event handlers
		**/
        _handleProcessEvent: function (sToken, oToken) {
            var that = this;
            var sProcessText = oToken.actio + "_ACTION_IN_PROGRESS";
            var oAppModel = this.getModel("appModel");
            that.openBusyFragment(sProcessText);

            $.ajax({
                url: "./api/processor/" + sToken
            }).done(function (data, textStatus, jqxhr) {
                that.closeBusyFragment();
                console.log("api/processor başarılı döndü")
                if (data.TYPE[0] === 'E'){
                     oAppModel.setProperty("/message", {
                    "type": "Error",
                    "icon": "sap-icon://error",
                     "text": that.getText("ERROR_OCCURRED"),
                    "description": data.MESSAGE_V1[0],
                    "visible": true
                });
                }
                else {
                     oAppModel.setProperty("/message", {
                    "type": "Success",
                    "icon": "sap-icon://message-success",
                    "text": that.getText("OPERATION_SUCCESSFUL"),
                    "description": 'İşlem başarılı',
                    "visible": true
                });
                }
               
            }).error(function (jqxhr, textStatus, errorThrown) {
                that.closeBusyFragment();
                oAppModel.setProperty("/message", {
                    "type": "Error",
                    "icon": "sap-icon://error",
                    "text": that.getText("ERROR_OCCURRED"),
                    "description": jqxhr.responseText,
                    "visible": true
                });
            });
        }

    });


});