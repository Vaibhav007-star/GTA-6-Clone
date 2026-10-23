/**
 * Vice City & Desi Bazaar Mega-Store Engine
 * Complete shopping system allowing players to buy:
 * 1. Indian & Exotic Vehicles (Thar 4x4, Tuk-Tuk Auto, Bullet 350, Scorpio, Truck, Supercars)
 * 2. Ammu-Nation Firearms & Weapons (Pistol, SMG, Shotgun, AK-47)
 * 3. Wardrobe & Outfits (Hawaiian, Mumbai Don Pathani, White Mafia Suit, Biker Leather, Desert Camo)
 * 4. Emergency Consumables (First Aid, Kevlar Armor, Nitro Refill, Police Bribe, Car Repair)
 */

class GameStore {
  constructor() {
    this.currentTab = 'vehicles';

    // Owned items tracked in storage
    this.initStorage();
    this.setupListeners();
  }

  get modal() {
    return document.getElementById('store-modal');
  }

  get itemsContainer() {
    return document.getElementById('store-items-grid');
  }

  get storeCashEl() {
    return document.getElementById('store-cash-val');
  }

  initStorage() {
    if (typeof storage !== 'undefined' && storage.get) {
      if (!storage.get('owned_vehicles')) {
        storage.set('owned_vehicles', ['sedan_standard']);
      }
      if (!storage.get('owned_weapons')) {
        storage.set('owned_weapons', ['unarmed', 'bat']);
      }
      if (!storage.get('owned_outfits')) {
        storage.set('owned_outfits', ['tommy_classic']);
      }
      if (!storage.get('player_outfit')) {
        storage.set('player_outfit', 'tommy_classic');
      }
    }
  }

  setupListeners() {
    if (typeof window !== 'undefined' && window.addEventListener) {
      // Open/Close Hotkey: Key 'B' (Buy / Bazaar) or Escape to close
      window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyB') {
          this.toggle();
        }
        if (e.code === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    }

    // Store button on top HUD
    const btnStore = document.getElementById('btn-open-store');
    if (btnStore) {
      btnStore.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
    }

    // Modal Close button
    const btnClose = document.getElementById('btn-close-store');
    if (btnClose) {
      btnClose.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close();
      });
    }

    // Tab buttons
    const tabButtons = document.querySelectorAll('.store-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.tab) {
          this.switchTab(btn.dataset.tab);
        }
      });
    });

    // Background backdrop click to close
    const modalEl = this.modal;
    if (modalEl) {
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
          this.close();
        }
      });
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  get isOpen() {
    const el = this.modal;
    return !!(el && el.style.display !== 'none' && el.style.display !== '');
  }

  open() {
    const el = this.modal;
    if (!el) return;
    el.style.display = 'flex';
    this.updateCashDisplay();
    this.renderTab();
  }

  close() {
    const el = this.modal;
    if (!el) return;
    el.style.display = 'none';
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    const tabBtns = document.querySelectorAll('.store-tab-btn');
    tabBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabName);
    });
    this.renderTab();
  }

  updateCashDisplay() {
    const el = this.storeCashEl;
    if (el && typeof storage !== 'undefined' && storage.getCash) {
      el.textContent = `$${String(storage.getCash()).padStart(6, '0')}`;
    }
  }

  renderTab() {
    this.updateCashDisplay();

    if (this.currentTab === 'vehicles') {
      this.renderVehicles();
    } else if (this.currentTab === 'weapons') {
      this.renderWeapons();
    } else if (this.currentTab === 'outfits') {
      this.renderOutfits();
    } else if (this.currentTab === 'items') {
      this.renderItems();
    }
  }

  /* =========================================================================
   * 1. VEHICLES TAB (Mahindra Thar, Auto Rickshaw, Bullet 350, etc.)
   * ========================================================================= */
  renderVehicles() {
    const container = this.itemsContainer;
    if (!container) return;

    const vehicles = (typeof dataManager !== 'undefined' && dataManager.getVehicles) ? dataManager.getVehicles() : [];
    const owned = (typeof storage !== 'undefined' && storage.get) ? (storage.get('owned_vehicles') || []) : [];
    const playerCash = (typeof storage !== 'undefined' && storage.getCash) ? storage.getCash() : 0;

    container.innerHTML = vehicles.map(v => {
      const isOwned = owned.includes(v.id);
      const canAfford = playerCash >= (v.price || 500);

      return `
        <div class="store-card">
          <div class="store-card-header">
            <span class="store-card-cat">${v.category || 'Vehicle'}</span>
            <span class="store-card-price">$${v.price || 500}</span>
          </div>
          <div class="store-card-title">${v.name}</div>
          <div class="store-card-desc">${v.description || 'Vice City street vehicle.'}</div>
          <div class="store-specs">
            <span>⚡ Top Speed: ${v.maxSpeed || 400}</span>
            <span>🛡️ Armor: ${v.health || 100}</span>
          </div>
          <div class="store-card-action">
            <button class="btn-store ${isOwned ? 'btn-owned' : (canAfford ? 'btn-buy' : 'btn-disabled')}"
                    onclick="window.gameStore.buyVehicle('${v.id}', ${v.price || 500})">
              ${isOwned ? '🚗 SPAWN / DELIVER' : (canAfford ? '🛒 BUY NOW' : '❌ NEED CASH')}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  buyVehicle(vehicleId, price) {
    const owned = (typeof storage !== 'undefined' && storage.get) ? (storage.get('owned_vehicles') || []) : [];
    const isOwned = owned.includes(vehicleId);

    if (!isOwned) {
      if (storage.getCash() < price) {
        if (typeof gameHUD !== 'undefined') gameHUD.showNotification('Not enough cash in wallet!');
        return;
      }
      storage.deductCash(price);
      owned.push(vehicleId);
      storage.set('owned_vehicles', owned);
      if (typeof audio !== 'undefined' && audio.playCash) audio.playCash();
      if (typeof gameHUD !== 'undefined') gameHUD.showNotification(`Purchased ${vehicleId.replace('_', ' ').toUpperCase()}!`);
    }

    // Spawn and deliver vehicle directly next to player in 3D world
    if (window.retroGame3D) {
      const vData = (typeof dataManager !== 'undefined') ? dataManager.getVehicleById(vehicleId) : { id: vehicleId, name: vehicleId };
      const p = window.retroGame3D.player;
      const typeKey = vehicleId === 'thar_4x4' ? 'THAR' :
                      (vehicleId === 'auto_rickshaw' ? 'AUTO_RICKSHAW' :
                      (vehicleId === 'bullet_350' ? 'BULLET_350' :
                      (vehicleId === 'scorpio_suv' ? 'SCORPIO' :
                      (vehicleId === 'desi_truck' ? 'DESI_TRUCK' :
                      (vData.id && vData.id.includes('sports') ? 'SPORTS' :
                      (vData.id && vData.id.includes('muscle') ? 'MUSCLE' : 'SEDAN'))))));

      const col = vData.colors ? vData.colors[0] : (vData.defaultColor || '#e74c3c');
      const v = new Vehicle3D(window.retroGame3D.scene, p.x + 18, p.z + 18, typeKey, p.angle, col);
      v.name = vData.name;
      window.retroGame3D.vehicles.push(v);

      if (typeof gameHUD !== 'undefined') gameHUD.showNotification(`Delivered 3D ${vData.name} right beside you!`);
      this.close();
    }
  }

  /* =========================================================================
   * 2. AMMU-NATION WEAPONS TAB
   * ========================================================================= */
  renderWeapons() {
    const container = this.itemsContainer;
    if (!container) return;

    const weapons = (typeof dataManager !== 'undefined' && dataManager.getWeapons) ? dataManager.getWeapons() : [];
    const owned = (typeof storage !== 'undefined' && storage.get) ? (storage.get('owned_weapons') || []) : [];
    const playerCash = (typeof storage !== 'undefined' && storage.getCash) ? storage.getCash() : 0;

    container.innerHTML = weapons.map(w => {
      const isOwned = owned.includes(w.id);
      const canAfford = playerCash >= (w.price || 0);

      return `
        <div class="store-card">
          <div class="store-card-header">
            <span class="store-card-icon">${w.icon || '🔫'}</span>
            <span class="store-card-price">${w.price === 0 ? 'FREE' : '$' + w.price}</span>
          </div>
          <div class="store-card-title">${w.name}</div>
          <div class="store-card-desc">${w.description || 'Military grade firepower.'}</div>
          <div class="store-specs">
            <span>💥 Damage: ${w.damage || 25}</span>
            <span>🎯 Range: ${w.range || 250}</span>
          </div>
          <div class="store-card-action">
            <button class="btn-store ${isOwned ? 'btn-owned' : (canAfford ? 'btn-buy' : 'btn-disabled')}"
                    onclick="window.gameStore.buyWeapon('${w.id}', ${w.price || 0})">
              ${isOwned ? '✅ EQUIP WEAPON' : (canAfford ? '🛒 BUY WEAPON' : '❌ NEED CASH')}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  buyWeapon(weaponId, price) {
    const owned = (typeof storage !== 'undefined' && storage.get) ? (storage.get('owned_weapons') || []) : [];
    const isOwned = owned.includes(weaponId);

    if (!isOwned) {
      if (storage.getCash() < price) {
        if (typeof gameHUD !== 'undefined') gameHUD.showNotification('Not enough cash for this firearm!');
        return;
      }
      storage.deductCash(price);
      owned.push(weaponId);
      storage.set('owned_weapons', owned);
      if (typeof audio !== 'undefined' && audio.playCash) audio.playCash();
      if (typeof gameHUD !== 'undefined') gameHUD.showNotification(`Purchased ${weaponId.toUpperCase()}!`);
    }

    // Equip weapon immediately in Combat System
    if (window.combatSystem) {
      const weapons = dataManager.getWeapons();
      const idx = weapons.findIndex(w => w.id === weaponId);
      if (idx !== -1) {
        window.combatSystem.currentWeaponIndex = idx;
        window.combatSystem.updateHUD();
        if (typeof gameHUD !== 'undefined') gameHUD.showNotification(`Equipped: ${weapons[idx].name}`);
        this.close();
      }
    }
  }

  /* =========================================================================
   * 3. WARDROBE & CLOTHES TAB
   * ========================================================================= */
  renderOutfits() {
    const container = this.itemsContainer;
    if (!container) return;

    const outfits = (typeof dataManager !== 'undefined' && dataManager.getOutfits) ? dataManager.getOutfits() : [];
    const owned = (typeof storage !== 'undefined' && storage.get) ? (storage.get('owned_outfits') || []) : [];
    const active = (typeof storage !== 'undefined' && storage.get) ? (storage.get('player_outfit') || 'tommy_classic') : 'tommy_classic';
    const playerCash = (typeof storage !== 'undefined' && storage.getCash) ? storage.getCash() : 0;

    container.innerHTML = outfits.map(o => {
      const isOwned = owned.includes(o.id);
      const isActive = active === o.id;
      const canAfford = playerCash >= (o.price || 0);

      return `
        <div class="store-card">
          <div class="store-card-header">
            <span class="store-card-icon">${o.icon || '👕'}</span>
            <span class="store-card-price">${o.price === 0 ? 'DEFAULT' : '$' + o.price}</span>
          </div>
          <div class="store-card-title">${o.name}</div>
          <div class="store-card-desc">${o.description || 'Authentic Vice City outfit.'}</div>
          <div class="store-specs">
            <span style="display:flex; align-items:center; gap:6px;">
              Shirt: <span style="width:14px; height:14px; border-radius:50%; background:${o.shirtColor}; display:inline-block; border:1px solid #fff;"></span>
              Pants: <span style="width:14px; height:14px; border-radius:50%; background:${o.pantsColor}; display:inline-block; border:1px solid #fff;"></span>
            </span>
          </div>
          <div class="store-card-action">
            <button class="btn-store ${isActive ? 'btn-active' : (isOwned ? 'btn-owned' : (canAfford ? 'btn-buy' : 'btn-disabled'))}"
                    onclick="window.gameStore.buyOutfit('${o.id}', ${o.price || 0})">
              ${isActive ? '⭐ WEARING' : (isOwned ? '👕 WEAR OUTFIT' : (canAfford ? '🛒 BUY OUTFIT' : '❌ NEED CASH'))}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  buyOutfit(outfitId, price) {
    const owned = (typeof storage !== 'undefined' && storage.get) ? (storage.get('owned_outfits') || []) : [];
    const isOwned = owned.includes(outfitId);

    if (!isOwned) {
      if (storage.getCash() < price) {
        if (typeof gameHUD !== 'undefined') gameHUD.showNotification('Not enough cash for this outfit!');
        return;
      }
      storage.deductCash(price);
      owned.push(outfitId);
      storage.set('owned_outfits', owned);
      if (typeof audio !== 'undefined' && audio.playCash) audio.playCash();
    }

    // Save active wardrobe selection
    if (typeof storage !== 'undefined' && storage.set) {
      storage.set('player_outfit', outfitId);
    }

    if (window.retroGame3D && window.retroGame3D.player) {
      window.retroGame3D.player.setOutfit(outfitId);
      this.close();
    }
  }

  /* =========================================================================
   * 4. CONSUMABLES & EMERGENCY GEAR TAB
   * ========================================================================= */
  renderItems() {
    const container = this.itemsContainer;
    if (!container) return;

    const items = (typeof dataManager !== 'undefined' && dataManager.getItems) ? dataManager.getItems() : [];
    const playerCash = (typeof storage !== 'undefined' && storage.getCash) ? storage.getCash() : 0;

    container.innerHTML = items.map(i => {
      const canAfford = playerCash >= i.price;

      return `
        <div class="store-card">
          <div class="store-card-header">
            <span class="store-card-icon">${i.icon || '🎒'}</span>
            <span class="store-card-price">$${i.price}</span>
          </div>
          <div class="store-card-title">${i.name}</div>
          <div class="store-card-desc">${i.description || 'Emergency equipment.'}</div>
          <div class="store-card-action">
            <button class="btn-store ${canAfford ? 'btn-buy' : 'btn-disabled'}"
                    onclick="window.gameStore.useItem('${i.id}', ${i.price}, '${i.effect}')">
              ${canAfford ? '⚡ BUY & USE' : '❌ NEED CASH'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  useItem(itemId, price, effect) {
    if (storage.getCash() < price) {
      if (typeof gameHUD !== 'undefined') gameHUD.showNotification('Not enough cash for this item!');
      return;
    }

    storage.deductCash(price);
    if (typeof audio !== 'undefined' && audio.playCash) audio.playCash();
    const game = window.retroGame3D;

    if (effect === 'HEALTH_100') {
      if (game && game.player) {
        game.player.health = 100;
        if (typeof gameHUD !== 'undefined') {
          gameHUD.updateHealthArmor(game.player.health, game.player.armor);
          gameHUD.showNotification('First Aid Used: Health fully restored to 100%!');
        }
      }
    } else if (effect === 'ARMOR_100') {
      if (game && game.player) {
        game.player.armor = 100;
        if (typeof gameHUD !== 'undefined') {
          gameHUD.updateHealthArmor(game.player.health, game.player.armor);
          gameHUD.showNotification('Tactical Armor Equipped: 100% Body Armor!');
        }
      }
    } else if (effect === 'NOS_100') {
      if (game && game.player && game.player.isInVehicle) {
        game.player.currentVehicle.nos = 100;
        if (typeof gameHUD !== 'undefined') gameHUD.updateNOS(100, false);
        if (typeof audio !== 'undefined' && audio.playNitro) audio.playNitro();
        if (typeof gameHUD !== 'undefined') gameHUD.showNotification('NOS Canister Installed: 100% Nitro Boost ready!');
      } else {
        if (typeof gameHUD !== 'undefined') gameHUD.showNotification('NOS Canister stored in inventory (enter a vehicle)!');
      }
    } else if (effect === 'CLEAR_WANTED') {
      if (game && game.police) {
        game.police.setWantedLevel(0);
        if (typeof gameHUD !== 'undefined') gameHUD.showNotification('Lawyer Bribe Accepted: All Police Wanted Stars Cleared!');
      }
    } else if (effect === 'REPAIR_CAR') {
      if (game && game.player && game.player.isInVehicle) {
        game.player.currentVehicle.health = 100;
        if (typeof audio !== 'undefined' && audio.playPayAndSpray) audio.playPayAndSpray();
        if (typeof gameHUD !== 'undefined') gameHUD.showNotification('Toolkit Used: Vehicle completely repaired to 100%!');
      } else {
        if (typeof gameHUD !== 'undefined') gameHUD.showNotification('Must be inside a vehicle to use emergency toolkit!');
      }
    }

    this.updateCashDisplay();
    this.close();
  }
}

// Global initialization
const gameStore = new GameStore();

if (typeof window !== 'undefined') {
  window.GameStore = GameStore;
  window.gameStore = gameStore;
}
