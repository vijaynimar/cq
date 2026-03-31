import { Schema,model } from "mongoose";
const userSchema=new Schema({
    firstName:{type:String,required:true},
    lastName:{type:String},
    email:{type:String,unique:true},
    password:{type:String,required:true},
    phone:{type:String},
    image:{type:String},
    walletMoney:{type:String},
    role:{type:String,enum:["student","admin"],default:"student"},
    createdAt:{type:Date,default:Date.now},
    deletedAt:{type:Date,default:null}
})
export const User=model("User",userSchema)