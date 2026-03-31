import { Schema,model } from "mongoose";
const productSchema=new Schema({
    name:{type:String,required:true},
    description:{type:String,default:""},
    totalStocks:{type:Number,required:true},
    image:{type:[String]},
    type:{type:String,enum:["veg","non-veg"],default:"veg"},
    category:{type:String,enum:["breakfast","lunch","snacks","drinks"],default:"snacks"},
    isOutOfStock:{type:Boolean,default:false},
    price:{type:Number,required:true},
    updatedAt:{type:Date,default:Date.now()},
    createdAt:{type:Date,default:Date.now()},
    deletedAt:{type:Date,default:null}
})

export const Product=model("Product",productSchema)