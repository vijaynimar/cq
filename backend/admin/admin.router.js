import {Router} from "express"
import {authenticateToken,authorizeAdmin} from "../middleware/auth.js"
import {addProduct,getAllProducts,getSingleProduct,updateProduct,deleteProduct} from "./admin.controller.js"
import {upload} from "../middleware/multer.js"
const adminRouter=Router();
adminRouter.use(authenticateToken);
adminRouter.use(authorizeAdmin);
adminRouter.post("/addProduct", upload, addProduct)
adminRouter.get("/products", getAllProducts);
adminRouter.get("/products/:id", getSingleProduct);
adminRouter.put("/products/:id", upload, updateProduct);
adminRouter.delete("/products/:id", deleteProduct);

export default adminRouter;