// نقطة واحدة تستورد منها كل الـ actions: `import { fetchMedicines } from "@/actions"`

export { renderError } from "./helpers";

export { getAuthUser, getAdminUser } from "./user";

export {
  fetchUsers,
  createUserAction,
  registerUserAction,
  setUserActiveAction,
} from "./accounts";

export {
  fetchCategories,
  fetchSingleCategory,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "./categories";

export {
  fetchMedicines,
  fetchSingleMedicine,
  fetchMedicineByBarcode,
  createMedicineAction,
  updateMedicineAction,
  deleteMedicineAction,
} from "./medicines";

export {
  createBatchAction,
  updateBatchAction,
  deleteBatchAction,
} from "./batches";

export {
  fetchCustomers,
  fetchSingleCustomer,
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
} from "./customers";

export { fetchSettings, updateSettingsAction } from "./settings";

export { fetchSales, fetchSingleSale, createSaleAction } from "./sales";

export { createSaleReturnAction } from "./returns";
