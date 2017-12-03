
//its lonely here...
module.exports = {
    isEmpty: function (obj){
        return JSON.stringify(obj) === JSON.stringify({})
    }
};
