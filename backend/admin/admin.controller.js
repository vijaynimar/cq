import { Product } from "../model/product.js";
import { User } from "../model/user.js";
import { WalletTransaction } from "../model/walletTransaction.js";
import { Cart } from "../model/cart.js";
import { Order } from "../model/order.js";
import {v2} from "cloudinary"
import fs from "fs/promises"
v2.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
  });
export const addProduct=async(req,res)=>{
    try{
        const {name,totalStocks,price,type,category,description,isOutOfStock}=req.body;
        if(!name || !totalStocks || !price){
            return res.status(400).json({error:"Name, stock, and price are required"})
        }
        // Handle image upload to Cloudinary
        let imageUrl = [];
        if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => {
        return v2.uploader.upload(file.path)
                    .then((result) => {
                        fs.unlink(file.path).catch(err => console.warn('Failed to delete:', file.path));
                        return result.secure_url;
                    });
      });

      imageUrl = await Promise.all(uploadPromises);
    }
        const newProduct=new Product({
            name,
            description: description || "",
            totalStocks,
            price,
            type: type || "veg",
            category: category || "snacks",
            isOutOfStock: String(isOutOfStock) === "true",
            image: imageUrl
        })
        const savedProduct=await newProduct.save();
        res.status(201).json(savedProduct)
    }catch(error){
        console.error('Error adding product:',error);
        res.status(500).json({error:"Failed to add product"})
    }   
}

export const getAllProducts=async(req,res)=>{
    try{
        const products=await Product.find({deletedAt:null});
        res.json(products)
    }catch(error){
        console.error('Error fetching products:',error);
        res.status(500).json({error:"Failed to fetch products"})
    }
}

export const getSingleProduct=async(req,res)=>{
    try{
        const {id}=req.params;
        const product=await Product.findById(id);
        if(!product){
            return res.status(404).json({error:"Product not found"})
        }
        res.json(product)
    }catch(error){
        console.error('Error fetching product:',error);
        res.status(500).json({error:"Failed to fetch product"})
    }
}

export const updateProduct=async(req,res)=>{
    try{
        const {id}=req.params;
        const {name,totalStocks,price,type,category,description,isOutOfStock}=req.body;
        
        const updateData={};
        if(name) updateData.name=name;
        if(description!==undefined) updateData.description=description;
        if(totalStocks!==undefined) updateData.totalStocks=totalStocks;
        if(price) updateData.price=price;
        if(type) updateData.type=type;
        if(category) updateData.category=category;
        if(isOutOfStock!==undefined) updateData.isOutOfStock=String(isOutOfStock)==="true";
        updateData.updatedAt=new Date();
        
        // Handle new image uploads
        if(req.files && req.files.length>0){
            const uploadPromises=req.files.map((file)=>{
                return v2.uploader.upload(file.path)
                  .then((result)=>{
                    fs.unlink(file.path).catch(err=>console.warn('Failed to delete:',file.path));
                    return result.secure_url;
                  });
            });
            const newImageUrls=await Promise.all(uploadPromises);
            updateData.image=newImageUrls;
        }
        
        const updatedProduct=await Product.findByIdAndUpdate(id,updateData,{new:true});
        if(!updatedProduct){
            return res.status(404).json({error:"Product not found"})
        }
        res.json(updatedProduct)
    }catch(error){
        console.error('Error updating product:',error);
        res.status(500).json({error:"Failed to update product"})
    }
}

export const deleteProduct=async(req,res)=>{
    try{
        const {id}=req.params;
        const deletedProduct=await Product.findByIdAndUpdate(id,{deletedAt:new Date()},{new:true});
        if(!deletedProduct){
            return res.status(404).json({error:"Product not found"})
        }
        res.json({message:"Product deleted successfully",product:deletedProduct})
    }catch(error){
        console.error('Error deleting product:',error);
        res.status(500).json({error:"Failed to delete product"})
    }
}

export const getAllStudents=async(req,res)=>{
    try{
        const students=await User.find({role:"student",deletedAt:null}).select("-password");
        res.json(students)
    }catch(error){
        console.error('Error fetching students:',error);
        res.status(500).json({error:"Failed to fetch students"})
    }
}

export const updateStudentByAdmin=async(req,res)=>{
    try{
        const {id}=req.params;
        const student=await User.findOne({_id:id,role:"student",deletedAt:null});
        if(!student){
            return res.status(404).json({error:"Student not found"})
        }

        const protectedFields=["role","password","email","phone","createdAt","deletedAt","_id"];
        const updateData={};

        Object.keys(req.body || {}).forEach((key)=>{
            if(!protectedFields.includes(key)){
                updateData[key]=req.body[key];
            }
        });

        if(req.file){
            try{
                const uploaded=await v2.uploader.upload(req.file.path);
                updateData.image=uploaded.secure_url;
                fs.unlink(req.file.path).catch(()=>{});
            }catch(uploadErr){
                console.error('Cloudinary upload error for student image:',uploadErr);
                return res.status(500).json({error:"Failed to upload student image"})
            }
        }

        if(Object.keys(updateData).length===0){
            return res.status(400).json({error:"No editable fields provided"})
        }

        if(updateData.walletMoney!==undefined){
            const parsedWallet=Number(updateData.walletMoney);
            if(Number.isFinite(parsedWallet) && parsedWallet>=0){
                updateData.walletMoney=parsedWallet;
            }else{
                return res.status(400).json({error:"walletMoney must be a valid non-negative number"})
            }
        }

        const updatedStudent=await User.findByIdAndUpdate(id,updateData,{new:true}).select("-password");
        res.json(updatedStudent)
    }catch(error){
        console.error('Error updating student:',error);
        res.status(500).json({error:"Failed to update student"})
    }
}

export const deleteStudentByAdmin=async(req,res)=>{
    try{
        const {id}=req.params;
        const student=await User.findOne({_id:id,role:"student"}).select("-password");
        if(!student){
            return res.status(404).json({error:"Student not found"})
        }

        await Promise.all([
            WalletTransaction.deleteMany({userId:id}),
            Cart.deleteOne({userId:id}),
            Order.deleteMany({userId:id}),
            User.findByIdAndDelete(id),
        ]);

        res.json({message:"Student and related data deleted successfully",student})
    }catch(error){
        console.error('Error deleting student:',error);
        res.status(500).json({error:"Failed to delete student"})
    }
}

export const toggleProductStock=async(req,res)=>{
    try{
        const {id}=req.params;
        const {isOutOfStock}=req.body;
        if(isOutOfStock===undefined){
            return res.status(400).json({error:"isOutOfStock is required"})
        }

        const updated=await Product.findByIdAndUpdate(
            id,
            {isOutOfStock:String(isOutOfStock)==="true",updatedAt:new Date()},
            {new:true}
        );
        if(!updated){
            return res.status(404).json({error:"Product not found"})
        }
        res.json(updated)
    }catch(error){
        console.error('Error toggling stock:',error);
        res.status(500).json({error:"Failed to update stock"})
    }
}

export const getLiveOrderQueue=async(req,res)=>{
    try{
        const queue=await Order.find({})
            .sort({createdAt:-1})
            .populate("userId","firstName lastName email");
        res.json(queue)
    }catch(error){
        console.error('Error fetching live queue:',error);
        res.status(500).json({error:"Failed to fetch order history"})
    }
}

export const updateOrderKitchenStatus=async(req,res)=>{
    try{
        const {id}=req.params;
        const {kitchenStatus}=req.body;
        const allowed=["received","preparing","ready","completed","cancelled"];
        if(!allowed.includes(kitchenStatus)){
            return res.status(400).json({error:"Invalid kitchen status"})
        }

        const order=await Order.findById(id);
        if(!order){
            return res.status(404).json({error:"Order not found"})
        }

        if(order.kitchenStatus==="completed"){
            return res.status(409).json({error:"Completed orders cannot be edited"})
        }

        order.kitchenStatus=kitchenStatus;
        order.timeline.push({
            status:kitchenStatus,
            note:`Kitchen status set to ${kitchenStatus}`,
            at:new Date(),
        });
        await order.save();
        res.json(order)
    }catch(error){
        console.error('Error updating order status:',error);
        res.status(500).json({error:"Failed to update order status"})
    }
}

export const getDashboardAnalytics = async (req, res) => {
    try {
        const weekdayNames = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];

        const [salesByDayRaw, popularItemsRaw, ordersPerHourRaw] = await Promise.all([
            Order.aggregate([
                {
                    $match: {
                        kitchenStatus: { $ne: "cancelled" },
                    },
                },
                {
                    $group: {
                        _id: { $dayOfWeek: "$createdAt" },
                        totalSales: { $sum: { $ifNull: ["$amountSummary.total", 0] } },
                        totalOrders: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            Order.aggregate([
                {
                    $match: {
                        kitchenStatus: { $ne: "cancelled" },
                    },
                },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.productId",
                        name: { $first: "$items.nameSnapshot" },
                        totalOrdered: { $sum: "$items.quantity" },
                    },
                },
                { $sort: { totalOrdered: -1 } },
                { $limit: 8 },
            ]),
            Order.aggregate([
                {
                    $match: {
                        kitchenStatus: { $ne: "cancelled" },
                    },
                },
                {
                    $group: {
                        _id: { $hour: "$createdAt" },
                        totalOrders: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
        ]);

        const salesByDay = weekdayNames.map((day, index) => {
            const found = salesByDayRaw.find((item) => item._id === index + 1);
            return {
                day,
                totalSales: Number((found?.totalSales || 0).toFixed(2)),
                totalOrders: found?.totalOrders || 0,
            };
        });

        const popularItems = popularItemsRaw.map((item) => ({
            productId: item._id,
            name: item.name || "Unknown Item",
            totalOrdered: item.totalOrdered || 0,
        }));

        const ordersPerHour = Array.from({ length: 24 }, (_, hour) => {
            const found = ordersPerHourRaw.find((item) => item._id === hour);
            return {
                hour,
                label: `${String(hour).padStart(2, "0")}:00`,
                totalOrders: found?.totalOrders || 0,
            };
        });

        res.json({
            salesByDay,
            popularItems,
            ordersPerHour,
        });
    } catch (error) {
        console.error("Error fetching admin dashboard analytics:", error);
        res.status(500).json({ error: "Failed to fetch dashboard analytics" });
    }
};