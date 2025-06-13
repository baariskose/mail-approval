const Joi = require("joi");
const _   = require("lodash");

function validateRequest(request) {
    try{
        if(request[0].hasOwnProperty("docid")){
            const schemaSingleApprovalObj = Joi.object({
                docid: Joi.string().required(),
                appno: Joi.string().required(),
                uname: Joi.string().max(12).required(),
                aptkn: Joi.string().allow(null).allow(''),
                rjtkn: Joi.string().allow(null).allow(''),
                rvtkn: Joi.string().allow(null).allow('')
            });
            const schemaSingleApprovalArr = Joi.array().items(schemaSingleApprovalObj);
    
            return  schemaSingleApprovalArr.validate(request);
        }else{
            const schemaGroupApprovalObj =  Joi.object({
                mapid: Joi.string().required(),
                uname: Joi.string().max(12).required(),
                aptkn: Joi.string().allow(null).allow(''),
                rjtkn: Joi.string().allow(null).allow(''),
                rvtkn: Joi.string().allow(null).allow('')
            });
            const schemaGroupApprovalArr = Joi.array().items(schemaGroupApprovalObj);
    
            return schemaGroupApprovalArr.validate(request);
        }
    }catch(oEx){
        throw new Exception("Unknown error:" + oEx ); 
    }
}

exports.validateRequest = validateRequest;