import { Schema,model } from "mongoose";
const productSchema=new Schema({
    name:{type:String,required:true},
    totalStocks:{type:Number,required:true},
    image:{type:[String]},
    type:{type:String,enum:["veg","non-veg"],default:"veg"},
    price:{type:Number,required:true},
    updatedAt:{type:Date,default:Date.now()},
    createdAt:{type:Date,default:Date.now()},
    deletedAt:{type:Date,default:null}
})

export const Product=model("Product",productSchema)