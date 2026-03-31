import {Router} from "express"
import {authenticateToken,authorizeAdmin} from "../middleware/auth.js"
import {addProduct,getAllProducts,getSingleProduct,updateProduct,deleteProduct,getAllStudents,updateStudentByAdmin,deleteStudentByAdmin} from "./admin.controller.js"
import {upload, profileMulter} from "../middleware/multer.js"
const adminRouter=Router();
adminRouter.use(authenticateToken);
adminRouter.use(authorizeAdmin);
adminRouter.post("/addProduct", upload, addProduct)
adminRouter.get("/products", getAllProducts);
adminRouter.get("/products/:id", getSingleProduct);
adminRouter.put("/products/:id", upload, updateProduct);
adminRouter.delete("/products/:id", deleteProduct);
adminRouter.get("/students", getAllStudents);
adminRouter.put("/students/:id", profileMulter.single("image"), updateStudentByAdmin);
adminRouter.delete("/students/:id", deleteStudentByAdmin);

export default adminRouter;