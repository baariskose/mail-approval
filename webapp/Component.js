sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
	"use strict";

	return UIComponent.extend("workflow.approvals.com.kizilay.Component", {

		metadata : {
			manifest: "json"
		},

		init : function () {
			// call the init function of the parent
			UIComponent.prototype.init.apply(this, arguments);

			// set data model
			var oData = {
				token: null,
				message: {
					"visible": false
				}
			};
			var oModel = new JSONModel(oData);
			this.setModel(oModel, "appModel");


			// create the views based on the url/hash
			this.getRouter().initialize();
		}
	});

});