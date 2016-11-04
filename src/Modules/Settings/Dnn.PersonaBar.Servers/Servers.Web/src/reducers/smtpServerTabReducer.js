import {smtpServerTab as ActionTypes}  from "../constants/actionTypes";

export default function smtpServerTabReducer(state = {
    smtpServerInfo: {},
    errorMessage: ""
}, action) {
    switch (action.type) {
        case ActionTypes.LOAD_SMTP_SERVER_TAB:
            return { ...state,
                smtpServerInfo: {},
                errorMessage: ""
            };
        case ActionTypes.LOADED_SMTP_SERVER_TAB:
            return { ...state,
                smtpServerInfo: action.payload.smtpServerInfo,
                errorMessage: ""
            };
        case ActionTypes.ERROR_LOADING_SMTP_SERVER_TAB:
            return { ...state,
                smtpServerInfo: {},
                errorMessage:  action.payload.errorMessage
            };  
        default:
            return state; 
    }
}