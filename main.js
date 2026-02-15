// ==================== One-time reset for corrupted data ====================
if (!localStorage.getItem('_iceworld_init')) {
  localStorage.removeItem('cart');
  localStorage.removeItem('wishlist');
  localStorage.removeItem('orders');
  localStorage.removeItem('points');
  localStorage.removeItem('loggedInUser');
  localStorage.setItem('_iceworld_init', 'true');
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('IceWorld script loaded');

  // ==================== Safe localStorage helpers ====================
  function safeJSONParse(key, defaultValue) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`Corrupted ${key} cleared.`);
      localStorage.removeItem(key);
      return defaultValue;
    }
  }

  // ==================== Global Data ====================
  let cart = safeJSONParse('cart', []);
  let wishlist = safeJSONParse('wishlist', []);
  let orders = safeJSONParse('orders', []);
  let points = parseInt(localStorage.getItem('points')) || 0;
  let loggedInUser = localStorage.getItem('loggedInUser') || null;

  // ==================== DOM Elements ====================
  const cartSidebar = document.getElementById('cart-sidebar');
  const cartBtn = document.getElementById('cart-btn');
  const closeCart = document.getElementById('close-cart');
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total-price');
  const cartCount = document.getElementById('cart-count');
  const checkoutBtn = document.getElementById('checkout-btn');
  const checkoutModal = document.getElementById('checkout-modal');
  const backToCart = document.getElementById('back-to-cart');
  const checkoutForm = document.getElementById('checkout-form');
  const wishlistSidebar = document.getElementById('wishlist-sidebar');
  const wishlistBtn = document.getElementById('wishlist-btn');
  const closeWishlist = document.getElementById('close-wishlist');
  const wishlistItems = document.getElementById('wishlist-items');
  const wishlistCount = document.getElementById('wishlist-count');
  const pointsDisplay = document.getElementById('points-display');
  const userBtn = document.getElementById('user-btn');
  const loginModal = document.getElementById('login-modal');
  const signupModal = document.getElementById('signup-modal');
  const ordersModal = document.getElementById('orders-modal');
  const closeLogin = document.getElementById('close-login');
  const closeSignup = document.getElementById('close-signup');
  const closeOrders = document.getElementById('close-orders');
  const showSignup = document.getElementById('show-signup');
  const showLogin = document.getElementById('show-login');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const ordersList = document.getElementById('orders-list');

  // ==================== Utility Functions ====================
  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    if (cartCount) cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  function saveWishlist() {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
    updateWishlistIcons();
    if (wishlistCount) wishlistCount.textContent = wishlist.length;
  }

  function updatePointsUI() {
    if (pointsDisplay) pointsDisplay.innerHTML = `⭐ ${points} pts`;
  }

  // ==================== Cart Functions ====================
  function updateCartUI() {
    if (!cartItems) return;
    if (cart.length === 0) {
      cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
    } else {
      cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}">
          <div class="cart-item-details">
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-price">$${item.price.toFixed(2)}</div>
            <div class="cart-item-quantity">
              <button class="quantity-btn" data-id="${item.id}" data-change="-1">-</button>
              <span>${item.quantity}</span>
              <button class="quantity-btn" data-id="${item.id}" data-change="1">+</button>
              <i class="ri-delete-bin-line remove-item" data-id="${item.id}"></i>
            </div>
          </div>
        </div>
      `).join('');
    }
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (cartTotal) cartTotal.textContent = `$${total.toFixed(2)}`;
    attachCartEvents();
  }

  function attachCartEvents() {
    document.querySelectorAll('.quantity-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const change = parseInt(e.target.dataset.change);
        const item = cart.find(i => i.id === id);
        if (item) {
          item.quantity += change;
          if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
          saveCart();
        }
      });
    });
    document.querySelectorAll('.remove-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        cart = cart.filter(i => i.id !== id);
        saveCart();
      });
    });
  }

  // ==================== Wishlist Functions ====================
  function updateWishlistUI() {
    if (!wishlistItems) return;
    if (wishlist.length === 0) {
      wishlistItems.innerHTML = '<p class="empty-cart">Your wishlist is empty</p>';
    } else {
      wishlistItems.innerHTML = wishlist.map(item => `
        <div class="wishlist-item">
          <img src="${item.image}" alt="${item.name}">
          <div class="wishlist-item-details">
            <div class="wishlist-item-title">${item.name}</div>
            <div class="wishlist-item-price">$${item.price.toFixed(2)}</div>
          </div>
          <i class="ri-delete-bin-line wishlist-remove" data-id="${item.id}"></i>
        </div>
      `).join('');
    }
    if (wishlistCount) wishlistCount.textContent = wishlist.length;
    attachWishlistEvents();
  }

  function attachWishlistEvents() {
    document.querySelectorAll('.wishlist-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        wishlist = wishlist.filter(item => item.id !== id);
        saveWishlist();
      });
    });
  }

  function updateWishlistIcons() {
    document.querySelectorAll('.wishlist-icon').forEach(icon => {
      const id = icon.dataset.id;
      if (wishlist.some(item => item.id === id)) {
        icon.classList.add('active');
        icon.classList.remove('ri-heart-line');
        icon.classList.add('ri-heart-fill');
      } else {
        icon.classList.remove('active');
        icon.classList.remove('ri-heart-fill');
        icon.classList.add('ri-heart-line');
      }
    });
  }

  // ==================== Order Functions ====================
  function addPoints(amountSpent) {
    points += Math.floor(amountSpent * 10);
    localStorage.setItem('points', points);
    updatePointsUI();
  }

  function saveOrder(orderData) {
    const newOrder = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      deliveryTime: orderData.deliveryTime,
      address: `${orderData.address}, ${orderData.city}, ${orderData.country}`,
      status: 'Confirmed'
    };
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));
    addPoints(newOrder.total);
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateAllUI();
    displayOrders();
  }

  function displayOrders() {
    if (!ordersList) return;
    if (orders.length === 0) ordersList.innerHTML = '<p>No orders yet.</p>';
    else {
      ordersList.innerHTML = orders.map(order => `
        <div class="order-item">
          <div class="order-header">
            <span>Order #${order.id}</span>
            <span class="order-status">${order.status}</span>
          </div>
          <div class="order-products">
            ${order.items.map(item => `${item.name} x${item.quantity}`).join(', ')}
          </div>
          <div>Total: $${order.total.toFixed(2)}</div>
          <div>Deliver: ${order.deliveryTime} to ${order.address}</div>
        </div>
      `).join('');
    }
  }

  // ==================== Countdown Timers ====================
  function startCountdown(id, hours, minutes, seconds) {
    const end = Date.now() + (hours * 3600 + minutes * 60 + seconds) * 1000;
    const timer = setInterval(() => {
      const diff = end - Date.now();
      if (diff <= 0) {
        clearInterval(timer);
        const el = document.getElementById(id);
        if (el) el.textContent = 'Expired';
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const el = document.getElementById(id);
      if (el) el.textContent = `Ends in: ${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }, 1000);
  }
  startCountdown('offer1-countdown', 2, 15, 30);
  startCountdown('offer2-countdown', 1, 5, 20);
  startCountdown('offer3-countdown', 0, 45, 10);

  // ==================== Update All UI ====================
  function updateAllUI() {
    updateCartUI();
    updateWishlistUI();
    updatePointsUI();
    updateWishlistIcons();
    if (cartCount) cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (wishlistCount) wishlistCount.textContent = wishlist.length;
  }
  updateAllUI();

  // ==================== Event Listeners ====================
  // Add to cart
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('[data-id]');
      if (!card) return;
      const id = card.dataset.id;
      const name = card.dataset.name;
      const price = parseFloat(card.dataset.price);
      const image = card.dataset.image;
      const existing = cart.find(item => item.id === id);
      if (existing) existing.quantity += 1;
      else cart.push({ id, name, price, image, quantity: 1 });
      saveCart();
    });
  });

  // Wishlist toggle
  document.querySelectorAll('.wishlist-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = e.target.closest('[data-id]');
      if (!card) return;
      const id = card.dataset.id;
      const name = card.dataset.name;
      const price = parseFloat(card.dataset.price);
      const image = card.dataset.image;
      const index = wishlist.findIndex(item => item.id === id);
      if (index === -1) wishlist.push({ id, name, price, image });
      else wishlist.splice(index, 1);
      saveWishlist();
    });
  });

  // Sidebar toggles
  if (cartBtn && cartSidebar) cartBtn.addEventListener('click', () => cartSidebar.classList.add('open'));
  if (closeCart && cartSidebar) closeCart.addEventListener('click', () => cartSidebar.classList.remove('open'));
  if (wishlistBtn && wishlistSidebar) wishlistBtn.addEventListener('click', () => wishlistSidebar.classList.add('open'));
  if (closeWishlist && wishlistSidebar) closeWishlist.addEventListener('click', () => wishlistSidebar.classList.remove('open'));

  // Checkout
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) { alert('Cart empty'); return; }
      if (checkoutModal) checkoutModal.classList.add('show');
      if (cartSidebar) cartSidebar.classList.remove('open');
    });
  }
  if (backToCart && checkoutModal) {
    backToCart.addEventListener('click', () => {
      checkoutModal.classList.remove('show');
      if (cartSidebar) cartSidebar.classList.add('open');
    });
  }
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const orderData = {
        name: document.getElementById('name').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        country: document.getElementById('country').value,
        phone: document.getElementById('phone').value,
        deliveryTime: document.getElementById('delivery-time').value
      };
      saveOrder(orderData);
      alert(`Order confirmed! You earned ${Math.floor(cart.reduce((sum,item)=>sum+item.price*item.quantity,0)*10)} points.`);
      if (checkoutModal) checkoutModal.classList.remove('show');
    });
  }

  // User login/orders
  if (userBtn) {
    userBtn.addEventListener('click', () => {
      if (loggedInUser) {
        displayOrders();
        if (ordersModal) ordersModal.classList.add('show');
      } else {
        if (loginModal) loginModal.classList.add('show');
      }
    });
  }

  // Modal close buttons
  if (closeLogin && loginModal) closeLogin.addEventListener('click', () => loginModal.classList.remove('show'));
  if (closeSignup && signupModal) closeSignup.addEventListener('click', () => signupModal.classList.remove('show'));
  if (closeOrders && ordersModal) closeOrders.addEventListener('click', () => ordersModal.classList.remove('show'));

  // Switch between login/signup
  if (showSignup && loginModal && signupModal) {
    showSignup.addEventListener('click', (e) => {
      e.preventDefault();
      loginModal.classList.remove('show');
      signupModal.classList.add('show');
    });
  }
  if (showLogin && signupModal && loginModal) {
    showLogin.addEventListener('click', (e) => {
      e.preventDefault();
      signupModal.classList.remove('show');
      loginModal.classList.add('show');
    });
  }

  // Mock login/signup
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loggedInUser = document.getElementById('login-email').value;
      localStorage.setItem('loggedInUser', loggedInUser);
      if (loginModal) loginModal.classList.remove('show');
      alert(`Welcome back, ${loggedInUser}!`);
    });
  }
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loggedInUser = document.getElementById('signup-email').value;
      localStorage.setItem('loggedInUser', loggedInUser);
      if (signupModal) signupModal.classList.remove('show');
      alert(`Account created! Welcome, ${loggedInUser}!`);
    });
  }

  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) e.target.classList.remove('show');
    if (e.target.classList.contains('checkout-modal') && checkoutModal) checkoutModal.classList.remove('show');
  });

  // Close sidebars when clicking outside
  document.addEventListener('click', (e) => {
    if (cartSidebar && cartBtn && !cartSidebar.contains(e.target) && !cartBtn.contains(e.target) && cartSidebar.classList.contains('open'))
      cartSidebar.classList.remove('open');
    if (wishlistSidebar && wishlistBtn && !wishlistSidebar.contains(e.target) && !wishlistBtn.contains(e.target) && wishlistSidebar.classList.contains('open'))
      wishlistSidebar.classList.remove('open');
  });
});