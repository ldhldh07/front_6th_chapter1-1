import { store } from "../store.js";
import { actions } from "../actions/index.js";
import { getProduct, getProducts } from "../api/productApi.js";
import { navigateTo } from "../utils/urlUtils.js";

export class ProductDetailController {
  #productId;
  #eventListeners = [];

  constructor(productId) {
    this.#productId = productId;
  }

  get state() {
    return store.getState();
  }

  async initialize() {
    await this.loadProductDetail();
  }

  setupEventListeners() {
    this.#removeEventListeners();
    this.#setupEventListeners();
  }

  #removeEventListeners() {
    this.#eventListeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    this.#eventListeners = [];
  }

  async loadProduct(productId) {
    this.#productId = productId;
    await this.loadProductDetail();
  }

  async loadProductDetail() {
    store.dispatch(actions.loadProductDetail());

    try {
      const product = await getProduct(this.#productId);
      store.dispatch(actions.productDetailLoaded(product));

      await this.#loadRelatedProducts(product);
    } catch (error) {
      console.error("상품 상세 정보 로딩 실패:", error);
      store.dispatch(actions.loadProductDetailError(error.message));
    }
  }

  async #loadRelatedProducts(product) {
    if (!product || !product.category1) return;

    store.dispatch(actions.loadRelatedProducts());

    try {
      const relatedData = await getProducts({
        category1: product.category1,
        category2: product.category2,
      });

      const relatedProducts = relatedData.products.filter(
        (product) => product.productId !== this.#productId && product.productId !== this.#productId,
      );

      store.dispatch(actions.relatedProductsLoaded(relatedProducts));
    } catch (error) {
      console.error("관련 상품 로딩 실패:", error);
    }
  }

  #setupEventListeners() {
    const clickHandler = (event) => {
      if (event.target.closest(".cart-modal")) {
        return;
      }

      if (event.target.closest("#quantity-decrease")) {
        event.preventDefault();
        event.stopPropagation();
        this.#handleQuantityDecrease();
        return;
      }

      if (event.target.closest("#quantity-increase")) {
        event.preventDefault();
        event.stopPropagation();
        this.#handleQuantityIncrease();
        return;
      }

      if (event.target.id === "add-to-cart-btn") {
        this.#handleAddToCart();
        return;
      }

      if (event.target.classList.contains("breadcrumb-link")) {
        this.#handleBreadcrumbClick(event);
        return;
      }

      if (event.target.classList.contains("go-to-product-list")) {
        this.#handleGoToProductList();
        return;
      }

      const relatedProductCard = event.target.closest(".related-product-card");
      if (relatedProductCard) {
        this.#handleRelatedProductClick(relatedProductCard);
        return;
      }
    };

    const changeHandler = (event) => {
      if (event.target.id === "quantity-input") {
        this.#handleQuantityInput(event);
      }
    };

    const inputHandler = (event) => {
      if (event.target.id === "quantity-input") {
        this.#handleQuantityInput(event);
      }
    };

    document.addEventListener("click", clickHandler);
    document.addEventListener("change", changeHandler);
    document.addEventListener("input", inputHandler);

    this.#eventListeners.push(
      { element: document, type: "click", handler: clickHandler },
      { element: document, type: "change", handler: changeHandler },
      { element: document, type: "input", handler: inputHandler },
    );
  }

  #handleQuantityDecrease() {
    const quantityInput = document.getElementById("quantity-input");
    if (!quantityInput) return;

    const currentQuantity = parseInt(quantityInput.value) || 1;
    quantityInput.value = Math.max(1, currentQuantity - 1);
  }

  #handleQuantityIncrease() {
    const quantityInput = document.getElementById("quantity-input");
    if (!quantityInput) return;

    const currentQuantity = parseInt(quantityInput.value) || 1;
    const maxStock = parseInt(quantityInput.getAttribute("max")) || 999;
    quantityInput.value = Math.min(maxStock, currentQuantity + 1);
  }

  #handleQuantityInput(event) {
    const maxStock = parseInt(event.target.getAttribute("max")) || 999;
    const inputValue = parseInt(event.target.value) || 1;
    const validatedQuantity = Math.max(1, Math.min(maxStock, inputValue));

    if (event.target.value !== validatedQuantity.toString()) {
      event.target.value = validatedQuantity;
    }
  }

  #handleAddToCart() {
    const state = store.getState();
    const { productDetail } = state;
    const { product } = productDetail || {};

    if (!product) {
      console.warn("상품 정보가 아직 로드되지 않았습니다.");
      return;
    }

    const quantityInput = document.getElementById("quantity-input");
    const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

    store.dispatch(actions.addToCart(product.productId, quantity));
    store.dispatch(actions.showToast("장바구니에 추가되었습니다"));
  }

  #handleBreadcrumbClick(event) {
    event.preventDefault();
    const category1 = event.target.dataset.category1;
    const category2 = event.target.dataset.category2;

    let queryParams = [];
    if (category1) queryParams.push(`category1=${encodeURIComponent(category1)}`);
    if (category2) queryParams.push(`category2=${encodeURIComponent(category2)}`);

    const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
    navigateTo(`/${queryString}`);
  }

  #handleGoToProductList() {
    navigateTo("/");
  }

  #handleRelatedProductClick(card) {
    const productId = card.dataset.productId;
    if (productId) {
      navigateTo(`/product/${productId}`);
    }
  }

  cleanup() {
    this.#eventListeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    this.#eventListeners = [];
  }
}
