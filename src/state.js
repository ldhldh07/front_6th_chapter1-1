import { getCartFromStorage } from "./utils/storage.js";

export const initialState = {
  products: [],
  error: null,

  categories: {},
  categoriesError: null,

  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },

  filters: {
    search: "",
    category1: "",
    category2: "",
    sort: "price_asc",
  },

  cart: {
    items: getCartFromStorage(),
    isModalOpen: false,
  },

  productDetail: {
    product: null,
    loading: false,
    error: null,
    relatedProducts: [],
    loadingRelatedProducts: false,
  },

  toast: {
    isVisible: false,
    message: "",
    type: "success",
  },

  currentRoute: "/",
};
