// Vimeo BG video

function initVimeoBGVideo() {
  // Select all elements that have [data-vimeo-bg-init]
  const vimeoPlayers = document.querySelectorAll('[data-vimeo-bg-init]');

  vimeoPlayers.forEach(function(vimeoElement, index) {
    
    // Add Vimeo URL ID to the iframe [src]
    // Looks like: https://player.vimeo.com/video/1019191082
    const vimeoVideoID = vimeoElement.getAttribute('data-vimeo-video-id');
    if (!vimeoVideoID) return;
    const vimeoVideoURL = `https://player.vimeo.com/video/${vimeoVideoID}?api=1&background=1&autoplay=1&loop=1&muted=1`;
    vimeoElement.querySelector('iframe').setAttribute('src', vimeoVideoURL);

    // Assign an ID to each element
    const videoIndexID = 'vimeo-bg-basic-index-' + index;
    vimeoElement.setAttribute('id', videoIndexID);

    const iframeID = vimeoElement.id;
    const player = new Vimeo.Player(iframeID);

    player.setVolume(0);
    
    player.on('bufferend', function() {
      vimeoElement.setAttribute('data-vimeo-activated', 'true');
      vimeoElement.setAttribute('data-vimeo-loaded', 'true');
    });
    
    // Update Aspect Ratio if [data-vimeo-update-size="true"]
    let videoAspectRatio;
    if (vimeoElement.getAttribute('data-vimeo-update-size') === 'true') {
      player.getVideoWidth().then(function(width) {
        player.getVideoHeight().then(function(height) {
          videoAspectRatio = height / width;
          const beforeEl = vimeoElement.querySelector('.vimeo-bg__before');
          if (beforeEl) {
            beforeEl.style.paddingTop = videoAspectRatio * 100 + '%';
          }
        });
      });
    }

    // Function to adjust video sizing
    function adjustVideoSizing() {
      const containerAspectRatio = (vimeoElement.offsetHeight / vimeoElement.offsetWidth) * 100;

      const iframeWrapper = vimeoElement.querySelector('.vimeo-bg__iframe-wrapper');
      if (iframeWrapper && videoAspectRatio) {
        if (containerAspectRatio > videoAspectRatio * 100) {
          iframeWrapper.style.width = `${(containerAspectRatio / (videoAspectRatio * 100)) * 100}%`;
        } else {
          iframeWrapper.style.width = '';
        }
      }
    }
    // Adjust video sizing initially
    if (vimeoElement.getAttribute('data-vimeo-update-size') === 'true') {
      adjustVideoSizing();
      player.getVideoWidth().then(function() {
        player.getVideoHeight().then(function() {
          adjustVideoSizing();
        });
      });
    } else {
      adjustVideoSizing();
    }
    // Adjust video sizing on resize
    window.addEventListener('resize', adjustVideoSizing);
  });
}

// Initialize Vimeo Background Video
document.addEventListener('DOMContentLoaded', function() {
  initVimeoBGVideo();
});


// Marquee

function initMarqueeScrollDirection() {
  document.querySelectorAll('[data-marquee-scroll-direction-target]').forEach((marquee) => {
    // Query marquee elements
    const marqueeContent = marquee.querySelector('[data-marquee-collection-target]');
    const marqueeScroll = marquee.querySelector('[data-marquee-scroll-target]');
    if (!marqueeContent || !marqueeScroll) return;

    // Get data attributes
    const { marqueeSpeed: speed, marqueeDirection: direction, marqueeDuplicate: duplicate, marqueeScrollSpeed: scrollSpeed } = marquee.dataset;

    // Convert data attributes to usable types
    const marqueeSpeedAttr = parseFloat(speed);
    const marqueeDirectionAttr = direction === 'right' ? 1 : -1; // 1 for right, -1 for left
    const duplicateAmount = parseInt(duplicate || 0);
    const scrollSpeedAttr = parseFloat(scrollSpeed);
    const speedMultiplier = window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1;

    let marqueeSpeed = marqueeSpeedAttr * (marqueeContent.offsetWidth / window.innerWidth) * speedMultiplier;

    // Precompute styles for the scroll container
    marqueeScroll.style.marginLeft = `${scrollSpeedAttr * -1}%`;
    marqueeScroll.style.width = `${(scrollSpeedAttr * 2) + 100}%`;

    // Duplicate marquee content
    if (duplicateAmount > 0) {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < duplicateAmount; i++) {
        fragment.appendChild(marqueeContent.cloneNode(true));
      }
      marqueeScroll.appendChild(fragment);
    }

    // GSAP animation for marquee content
    const marqueeItems = marquee.querySelectorAll('[data-marquee-collection-target]');
    const animation = gsap.to(marqueeItems, {
      xPercent: -100, // Move completely out of view
      repeat: -1,
      duration: marqueeSpeed,
      ease: 'linear'
    }).totalProgress(0.5);

    // Initialize marquee in the correct direction
    gsap.set(marqueeItems, { xPercent: marqueeDirectionAttr === 1 ? 100 : -100 });
    animation.timeScale(marqueeDirectionAttr); // Set correct direction
    animation.play(); // Start animation immediately

    // Set initial marquee status
    marquee.setAttribute('data-marquee-status', 'normal');

    // ScrollTrigger logic for direction inversion
    ScrollTrigger.create({
      trigger: marquee,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const isInverted = self.direction === 1; // Scrolling down
        const currentDirection = isInverted ? -marqueeDirectionAttr : marqueeDirectionAttr;

        // Update animation direction and marquee status
        animation.timeScale(currentDirection);
        marquee.setAttribute('data-marquee-status', isInverted ? 'normal' : 'inverted');
      }
    });

    // Extra speed effect on scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: marquee,
        start: '0% 100%',
        end: '100% 0%',
        scrub: 0
      }
    });

    const scrollStart = marqueeDirectionAttr === -1 ? scrollSpeedAttr : -scrollSpeedAttr;
    const scrollEnd = -scrollStart;

    tl.fromTo(marqueeScroll, { x: `${scrollStart}vw` }, { x: `${scrollEnd}vw`, ease: 'none' });
  });
}

// Initialize Marquee with Scroll Direction
document.addEventListener('DOMContentLoaded', () => {
  initMarqueeScrollDirection();
});


// GSAP slider

gsap.registerPlugin(Draggable, InertiaPlugin);

function initBasicGSAPSlider() {
  document.querySelectorAll('[data-gsap-slider-init]').forEach(root => {
    if (root._sliderDraggable) root._sliderDraggable.kill();

    const sliderId   = root.getAttribute('data-slider-id');
    const collection = root.querySelector('[data-gsap-slider-collection]');
    const track      = root.querySelector('[data-gsap-slider-list]');
    const items      = Array.from(root.querySelectorAll('[data-gsap-slider-item]'));

    // Zoek ook knoppen buiten root op basis van data-slider-target
    const controls = Array.from(document.querySelectorAll(
      `[data-gsap-slider-control][data-slider-target="${sliderId}"]`
    ));

    // Inject aria attributes
    root.setAttribute('role','region');
    root.setAttribute('aria-roledescription','carousel');
    root.setAttribute('aria-label','Slider');
    collection.setAttribute('role','group');
    collection.setAttribute('aria-roledescription','Slides List');
    collection.setAttribute('aria-label','Slides');
    items.forEach((slide,i) => {
      slide.setAttribute('role','group');
      slide.setAttribute('aria-roledescription','Slide');
      slide.setAttribute('aria-label',`Slide ${i+1} of ${items.length}`);
      slide.setAttribute('aria-hidden','true');
      slide.setAttribute('aria-selected','false');
      slide.setAttribute('tabindex','-1');
    });
    controls.forEach(btn => {
      const dir = btn.getAttribute('data-gsap-slider-control');
      btn.setAttribute('role','button');
      btn.setAttribute('aria-label', dir==='prev' ? 'Previous Slide' : 'Next Slide');
      btn.disabled = true;
      btn.setAttribute('aria-disabled','true');
    });

    // Determine if slider runs
    const styles      = getComputedStyle(root);
    const statusVar   = styles.getPropertyValue('--slider-status').trim();
    let   spvVar      = parseFloat(styles.getPropertyValue('--slider-spv'));
    const rect        = items[0].getBoundingClientRect();
    const marginRight = parseFloat(getComputedStyle(items[0]).marginRight);
    const slideW      = rect.width + marginRight;
    if (isNaN(spvVar)) {
      spvVar = collection.clientWidth / slideW;
    }
    const spv           = Math.max(1, Math.min(spvVar, items.length));
    const sliderEnabled = statusVar==='on' && spv < items.length;
    root.setAttribute('data-gsap-slider-status', sliderEnabled ? 'active' : 'not-active');

    if (!sliderEnabled) {
      // Teardown when disabled
      track.removeAttribute('style');
      track.onmouseenter = null;
      track.onmouseleave = null;
      track.removeAttribute('data-gsap-slider-list-status');
      root.removeAttribute('role');
      root.removeAttribute('aria-roledescription');
      root.removeAttribute('aria-label');
      collection.removeAttribute('role');
      collection.removeAttribute('aria-roledescription');
      collection.removeAttribute('aria-label');
      items.forEach(slide => {
        slide.removeAttribute('role');
        slide.removeAttribute('aria-roledescription');
        slide.removeAttribute('aria-label');
        slide.removeAttribute('aria-hidden');
        slide.removeAttribute('aria-selected');
        slide.removeAttribute('tabindex');
        slide.removeAttribute('data-gsap-slider-item-status');
      });
      controls.forEach(btn => {
        btn.disabled = false;
        btn.removeAttribute('role');
        btn.removeAttribute('aria-label');
        btn.removeAttribute('aria-disabled');
        btn.removeAttribute('data-gsap-slider-control-status');
      });
      return;
    }

    // Track hover state
    track.onmouseenter = () => {
      track.setAttribute('data-gsap-slider-list-status','grab');
    };
    track.onmouseleave = () => {
      track.removeAttribute('data-gsap-slider-list-status');
    };

    // Calculate bounds and snap points
    const vw        = collection.clientWidth;
    const tw        = track.scrollWidth;
    const maxScroll = Math.max(tw - vw, 0);
    const minX      = -maxScroll;
    const maxX      = 0;
    const maxIndex  = maxScroll / slideW;
    const full      = Math.floor(maxIndex);
    const snapPoints = [];
    for (let i = 0; i <= full; i++) {
      snapPoints.push(-i * slideW);
    }
    if (full < maxIndex) {
      snapPoints.push(-maxIndex * slideW);
    }

    let activeIndex    = 0;
    const setX         = gsap.quickSetter(track,'x','px');
    let collectionRect = collection.getBoundingClientRect();

    function updateStatus(x) {
      if (x > maxX || x < minX) {
        return;
      }

      // Clamp and find closest snap
      const calcX = x > maxX ? maxX : (x < minX ? minX : x);
      let closest = snapPoints[0];
      snapPoints.forEach(pt => {
        if (Math.abs(pt - calcX) < Math.abs(closest - calcX)) {
          closest = pt;
        }
      });
      activeIndex = snapPoints.indexOf(closest);

      // Update Slide Attributes
      items.forEach((slide,i) => {
        const r           = slide.getBoundingClientRect();
        const leftEdge    = r.left - collectionRect.left;
        const slideCenter = leftEdge + r.width/2;
        const inView      = slideCenter > 0 && slideCenter < collectionRect.width;
        const status      = i === activeIndex ? 'active' : inView ? 'inview' : 'not-active';

        slide.setAttribute('data-gsap-slider-item-status', status);
        slide.setAttribute('aria-selected',    i === activeIndex ? 'true' : 'false');
        slide.setAttribute('aria-hidden',      inView ? 'false' : 'true');
        slide.setAttribute('tabindex',         i === activeIndex ? '0'    : '-1');
      });

      // Update Controls
      controls.forEach(btn => {
        const dir = btn.getAttribute('data-gsap-slider-control');
        const can = dir === 'prev'
          ? activeIndex > 0
          : activeIndex < snapPoints.length - 1;

        btn.disabled = !can;
        btn.setAttribute('aria-disabled', can ? 'false' : 'true');
        btn.setAttribute('data-gsap-slider-control-status', can ? 'active' : 'not-active');
      });
    }

    // Event listeners voor controls buiten/ binnen de slider
    controls.forEach(btn => {
      const dir = btn.getAttribute('data-gsap-slider-control');
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const delta = dir === 'next' ? 1 : -1;
        const target = activeIndex + delta;
        gsap.to(track, {
          duration: 0.4,
          x: snapPoints[target],
          onUpdate: () => updateStatus(gsap.getProperty(track,'x'))
        });
      });
    });

    // Initialize Draggable
    root._sliderDraggable = Draggable.create(track, {
      type: 'x',
      inertia: true,
      bounds: {minX, maxX},
      throwResistance: 2000,
      dragResistance: 0.05,
      maxDuration: 0.6,
      minDuration: 0.2,
      edgeResistance: 0.75,
      snap: {x: snapPoints, duration: 0.4},
      onPress() {
        track.setAttribute('data-gsap-slider-list-status','grabbing');
        collectionRect = collection.getBoundingClientRect();
      },
      onDrag() {
        setX(this.x);
        updateStatus(this.x);
      },
      onThrowUpdate() {
        setX(this.x);
        updateStatus(this.x);
      },
      onThrowComplete() {
        setX(this.endX);
        updateStatus(this.endX);
        track.setAttribute('data-gsap-slider-list-status','grab');
      },
      onRelease() {
        setX(this.x);
        updateStatus(this.x);
        track.setAttribute('data-gsap-slider-list-status','grab');
      }
    })[0];

    // Initial state
    setX(0);
    updateStatus(0);
  });
}

// Debouncer: For resizing the window
function debounceOnWidthChange(fn, ms) {
  let last = innerWidth, timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (innerWidth !== last) {
        last = innerWidth;
        fn.apply(this, args);
      }
    }, ms);
  };
}

window.addEventListener('resize', debounceOnWidthChange(initBasicGSAPSlider, 200));

// Initialize Basic GSAP Slider
document.addEventListener('DOMContentLoaded', function() {
  initBasicGSAPSlider();
});
