/* Activity Finder — Static Site Client */
(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────

  var CATEGORIES = {
    music:        { label: 'Music & Live',          icon: '\u{1F3B5}' },
    'food-drink': { label: 'Food & Drink',          icon: '\u{1F37D}\u{FE0F}' },
    networking:   { label: 'Networking',             icon: '\u{1F4BC}' },
    'arts-culture':{ label: 'Arts & Culture',        icon: '\u{1F3A8}' },
    social:       { label: 'Social & Dating',        icon: '\u{1F465}' },
    learning:     { label: 'Learning',               icon: '\u{1F4DA}' },
    sports:       { label: 'Sports & Outdoor',       icon: '\u{26BD}' },
    faith:        { label: 'Faith & Spirituality',   icon: '\u{1F64F}' },
    nightlife:    { label: 'Parties & Nightlife',    icon: '\u{1F389}' },
    wellness:     { label: 'Wellness',               icon: '\u{1F3E5}' },
    other:        { label: 'Other',                  icon: '\u{1F4CC}' }
  };

  // ── State ──────────────────────────────────────────────────────────────

  var allEvents = [];
  var state = {
    activeDate: '',       // YYYY-MM-DD
    timePeriod: '',       // '' | morning | afternoon | evening | night
    category: '',         // '' | category slug
    freeOnly: false
  };

  // ── Initialization ─────────────────────────────────────────────────────

  function init() {
    showLoading(true);
    // Handle relative path for GitHub Pages deployment at /activity-finder/
    var basePath = window.location.pathname.includes('/activity-finder/') ? '/activity-finder/' : '';
    var jsonPath = basePath ? basePath + 'events.json' : 'events.json';
    fetch(jsonPath)
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to fetch events');
        return r.json();
      })
      .then(function (data) {
        allEvents = data.events || [];

        // Set location
        var locEl = document.getElementById('header-location');
        if (locEl && data.location_name) locEl.textContent = data.location_name;

        // Set footer
        var footerEl = document.getElementById('footer-text');
        if (footerEl && data.generated_at) {
          var d = new Date(data.generated_at);
          var dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          footerEl.textContent = 'Last updated: ' + dateStr + ' \u00B7 ' + data.event_count + ' events';
        }

        // Generate date sidebar
        var dates = generateDateList();
        state.activeDate = dates[0].value;
        renderDateSidebar(dates);

        // Initial render
        applyFilters();
        showLoading(false);
      })
      .catch(function (err) {
        console.error('Failed to load events:', err);
        showLoading(false);
        document.getElementById('activity-list').innerHTML = renderEmptyState('Could not load events. Please try again later.');
      });
  }

  // ── Date Generation ────────────────────────────────────────────────────

  function generateDateList() {
    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var dates = [];
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    for (var i = 0; i < 7; i++) {
      var d = new Date(today);
      d.setDate(today.getDate() + i);

      var yyyy = d.getFullYear();
      var mm = String(d.getMonth() + 1).padStart(2, '0');
      var dd = String(d.getDate()).padStart(2, '0');
      var value = yyyy + '-' + mm + '-' + dd;

      var dayName = dayNames[d.getDay()];
      var dayNum = d.getDate();
      var monthName = monthNames[d.getMonth()];

      var label;
      if (i === 0) label = 'Today (' + dayName + ' ' + dayNum + ' ' + monthName + ')';
      else if (i === 1) label = 'Tomorrow (' + dayName + ' ' + dayNum + ' ' + monthName + ')';
      else label = dayName + ' ' + dayNum + ' ' + monthName;

      dates.push({ value: value, label: label });
    }
    return dates;
  }

  // ── Filtering ──────────────────────────────────────────────────────────

  function filterEvents() {
    var filtered = [];

    for (var i = 0; i < allEvents.length; i++) {
      var ev = allEvents[i];

      // Date filter
      if (state.activeDate) {
        var evDate = (ev.start_time || '').substring(0, 10);
        if (evDate !== state.activeDate) continue;
      }

      // Time period filter (include null/unknown in all tabs)
      if (state.timePeriod) {
        if (ev.time_period !== state.timePeriod && ev.time_period !== null) continue;
      }

      // Category filter
      if (state.category) {
        if (ev.category !== state.category) continue;
      }

      // Free only
      if (state.freeOnly && !ev.is_free) continue;

      filtered.push(ev);
    }

    // Sort by start_time
    filtered.sort(function (a, b) {
      return (a.start_time || '').localeCompare(b.start_time || '');
    });

    return filtered;
  }

  function applyFilters() {
    var filtered = filterEvents();
    document.getElementById('activity-list').innerHTML = renderActivityList(filtered);
  }

  // ── Display Time Formatting ────────────────────────────────────────────

  function formatDisplayTime(startTime, endTime) {
    if (!startTime) return '';

    var start = new Date(startTime);
    var end = endTime ? new Date(endTime) : null;

    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    var dayOfWeek = dayNames[start.getDay()];
    var day = start.getDate();
    var month = monthNames[start.getMonth()];

    var startHours = start.getHours();
    var startMinutes = start.getMinutes();
    var isStartMidnight = startHours === 0 && startMinutes === 0;

    var result = dayOfWeek + ' ' + day + ' ' + month;

    if (!isStartMidnight) {
      var period = startHours >= 12 ? 'PM' : 'AM';
      var displayHours = startHours % 12 || 12;
      var displayMinutes = startMinutes.toString().padStart(2, '0');
      var timeStr = startMinutes > 0 ? displayHours + ':' + displayMinutes + ' ' + period : displayHours + ' ' + period;
      result += ', ' + timeStr;
    }

    if (end) {
      var endHours = end.getHours();
      var endMinutes = end.getMinutes();
      var isEndMidnight = endHours === 0 && endMinutes === 0;
      var isSameDay = start.toDateString() === end.toDateString();

      if (!isEndMidnight && !isSameDay) {
        var endDayOfWeek = dayNames[end.getDay()];
        var endDay = end.getDate();
        var endMonth = monthNames[end.getMonth()];
        var endPeriod = endHours >= 12 ? 'PM' : 'AM';
        var endDisplayHours = endHours % 12 || 12;
        var endDisplayMinutes = endMinutes.toString().padStart(2, '0');
        var endTimeStr = endMinutes > 0 ? endDisplayHours + ':' + endDisplayMinutes + ' ' + endPeriod : endDisplayHours + ' ' + endPeriod;
        result += ' \u2013 ' + endDayOfWeek + ' ' + endDay + ' ' + endMonth + ', ' + endTimeStr;
      } else if (!isEndMidnight && isSameDay) {
        var endPeriod2 = endHours >= 12 ? 'PM' : 'AM';
        var endDisplayHours2 = endHours % 12 || 12;
        var endDisplayMinutes2 = endMinutes.toString().padStart(2, '0');
        var endTimeStr2 = endMinutes > 0 ? endDisplayHours2 + ':' + endDisplayMinutes2 + ' ' + endPeriod2 : endDisplayHours2 + ' ' + endPeriod2;
        result += ' \u2013 ' + endTimeStr2;
      }
    }

    return result;
  }

  // ── Directions URL ─────────────────────────────────────────────────────

  function buildDirectionsUrl(activity) {
    var lat = activity.lat;
    var lng = activity.lng;
    var venueName = activity.venue_name || '';
    var address = activity.address || '';

    if (lat && lng && lat !== 0 && lng !== 0) {
      return 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng;
    } else if (address && address !== 'Manchester') {
      return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent((venueName ? venueName + ', ' : '') + address);
    } else if (venueName) {
      return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(venueName + ', Manchester');
    }
    return null;
  }

  // ── Rendering ──────────────────────────────────────────────────────────

  function esc(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderActivityList(activities) {
    if (activities.length === 0) {
      return renderEmptyState('No activities found for this time period.');
    }

    var html = '';
    for (var i = 0; i < activities.length; i++) {
      html += renderCard(activities[i]);
    }
    return html;
  }

  function renderCard(a) {
    var cat = CATEGORIES[a.category] || CATEGORIES.other;
    var displayTime = formatDisplayTime(a.start_time, a.end_time);
    var directionsUrl = buildDirectionsUrl(a);

    var priceMin = a.price_min != null ? a.price_min.toFixed(2) : '';
    var priceMax = a.price_max != null ? a.price_max.toFixed(2) : '';

    // Price display
    var priceHtml;
    if (a.is_free) {
      priceHtml = '<span class="price price-free">FREE</span>';
    } else if (priceMin) {
      if (priceMin === priceMax || !priceMax) {
        priceHtml = '<span class="price">&pound;' + priceMin + '</span>';
      } else {
        priceHtml = '<span class="price">&pound;' + priceMin + ' &ndash; &pound;' + priceMax + '</span>';
      }
    } else {
      priceHtml = '<span class="price">Price TBC</span>';
    }

    // Address with directions
    var addressHtml;
    if (directionsUrl) {
      addressHtml = '<a href="' + esc(directionsUrl) + '" target="_blank" rel="noopener noreferrer" class="directions-link">' +
        '<span class="venue-address">' + esc(a.address) + '</span>' +
        '<span class="directions-btn">Directions</span>' +
        '</a>';
    } else {
      addressHtml = '<p class="venue-address">' + esc(a.address) + '</p>';
    }

    return '<div class="activity-card" role="listitem">' +
      '<div class="activity-header">' +
        '<h3 class="activity-name"><a href="' + esc(a.url) + '" target="_blank" rel="noopener noreferrer">' + esc(a.name) + '</a></h3>' +
        '<div class="badge-group">' +
          '<span class="category-badge category-' + esc(a.category) + '">' + cat.icon + ' ' + esc(cat.label) + '</span>' +
          '<span class="source-badge source-' + esc(a.source) + '">' + esc(a.source) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="activity-details">' +
        '<div class="detail-row">' +
          '<svg class="icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M8 0C5.243 0 3 2.243 3 5c0 3.188 5 11 5 11s5-7.812 5-11c0-2.757-2.243-5-5-5zm0 7.5c-1.381 0-2.5-1.119-2.5-2.5S6.619 2.5 8 2.5s2.5 1.119 2.5 2.5S9.381 7.5 8 7.5z" fill="currentColor"/></svg>' +
          '<div><p class="venue-name">' + esc(a.venue_name) + '</p>' + addressHtml + '</div>' +
        '</div>' +
        '<div class="detail-row">' +
          '<svg class="icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M8 0C3.589 0 0 3.589 0 8s3.589 8 8 8 8-3.589 8-8-3.589-8-8-8zm0 14c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6z" fill="currentColor"/><path d="M8 4v4.5l3.5 2.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' +
          '<p class="activity-time">' + esc(displayTime) + '</p>' +
        '</div>' +
        '<div class="detail-row">' +
          '<svg class="icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8 4v4h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
          priceHtml +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderEmptyState(message) {
    return '<div class="empty-state">' +
      '<svg class="empty-icon" width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="2" fill="none"/>' +
        '<path d="M22 38c2 4 6 6 10 6s8-2 10-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
        '<circle cx="22" cy="26" r="2" fill="currentColor"/>' +
        '<circle cx="42" cy="26" r="2" fill="currentColor"/>' +
      '</svg>' +
      '<h3>' + esc(message) + '</h3>' +
      '<p>Try adjusting your filters or check back later for new events.</p>' +
    '</div>';
  }

  function renderDateSidebar(dates) {
    var container = document.getElementById('date-list');
    var html = '';
    for (var i = 0; i < dates.length; i++) {
      var d = dates[i];
      var cls = d.value === state.activeDate ? 'date-btn active' : 'date-btn';
      var ariaPressed = d.value === state.activeDate ? 'true' : 'false';
      html += '<button class="' + cls + '" aria-pressed="' + ariaPressed + '" data-date="' + d.value + '" onclick="setActiveDate(this)">' + esc(d.label) + '</button>';
    }
    container.innerHTML = html;
  }

  // ── UI Handlers ────────────────────────────────────────────────────────

  window.setActiveTab = function (btn) {
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.remove('active');
      tabs[i].setAttribute('aria-selected', 'false');
    }
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    state.timePeriod = btn.getAttribute('data-time-period') || '';
    applyFilters();
  };

  window.setActiveCategory = function (btn) {
    var pills = document.querySelectorAll('.category-pill');
    for (var i = 0; i < pills.length; i++) {
      pills[i].classList.remove('active');
      pills[i].setAttribute('aria-pressed', 'false');
    }
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    state.category = btn.getAttribute('data-category') || '';
    applyFilters();
  };

  window.setActiveDate = function (btn) {
    var btns = document.querySelectorAll('.date-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.remove('active');
      btns[i].setAttribute('aria-pressed', 'false');
    }
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    state.activeDate = btn.getAttribute('data-date') || '';
    applyFilters();
  };

  window.onFilterChange = function () {
    state.freeOnly = document.getElementById('free-only-checkbox').checked;
    applyFilters();
  };

  // ── Helpers ────────────────────────────────────────────────────────────

  function showLoading(show) {
    var el = document.getElementById('loading');
    el.style.display = show ? 'flex' : 'none';
  }

  // ── Boot ───────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
