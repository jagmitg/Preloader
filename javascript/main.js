// Create an immediately invoked functional expression to wrap our code
(function() {

  window.transitionEnd = (element, event_handler) => {
    let support_transition = false;
    const transition_names = [
      "transition",
      "WebkitTransition",
      "MozTransition",
      "msTransition"
    ];
    const temp_element = document.createElement("div");

    $(transition_names).each((index, transition_name) => {
      if (temp_element.style[transition_name] !== undefined) {
        support_transition = true;
        return false;
      }
    });


    if (support_transition) {
      const event_names = "webkitTransitionEnd oTransitionEnd MSTransitionEnd transitionend";

      $(element).bind(event_names, event => {
        $(this).unbind(event_names);
        event_handler(event, element);
      });
    } else {
      setTimeout(() => {
        event_handler(null, element);
      }, 0);
    }

    // return element so that we can chain methods
    return element;
  };

  this.JPreloader = function() {

    /**
     * Default properties
     * @type {Object}
     */
    const defaults = {
      overlay: null,
      percentage: null,
      text_loader: null,
      total: 0,
      loaded: 0,
      percentage_loaded: 0,
      mode: "number",
      text_colour: "#FFFFFF",
      images: [],
      image_queue: [],
      show_progress: true,
      show_percentage: true,
      background: "#000000",
      timeout: 10
    };


    if (arguments[0] && typeof arguments[0] === "object") {
      this.options = _extendDefaults(defaults, arguments[0]);
    }

  }

  /**
   * Prototype to start the functionality and initialising the preloader call
   * @type {Object}
   */
  JPreloader.prototype = {
    start: function(){
      initialisePreloader.call(this);
    },

    remove: function(){
      // this.element.removeEventListener(this.type, this.callback, false);
    }
  };

  /**
   * [initialisePreloader description]
   * @return {[type]} [description]
   */
  function initialisePreloader() {
    const domImages = document.getElementsByTagName("img");

    for(let i = 0; i < domImages.length; i++) {
      if (domImages[i].src) {
        this.options.images.push(domImages[i].src);
      }
    }

    /**
     * TODO:
     * Add cookie functionality
     * Add cookie default option to check against
     * Add and remove class depending on cookie checks
     */

    this.options.total = this.options.images.length;

    buildPreloader.call(this);
    loadPreloader.call(this);
  }

  function buildPreloader() {
    this.options.overlay = document.getElementById("jpreloader")

    if (this.options.overlay === null) {
      let overlayDiv = document.createElement("div");
          overlayDiv.id = "jpreloader";

      if (document.body !== null) {
        this.options.overlay = document.body.insertBefore(overlayDiv, document.body.firstChild);
      }
    }

    if (this.options.overlay !== null) {
      /**
       * TODO:
       * Expand the functionality to accept multiple modes
       * `jpreloader_${this.options.mode}`
       */
      addClass(this.options.overlay, `jpreloader_${this.options.mode}`);
    }

    this.options.overlay.style.backgroundColor = this.options.background;

    const rgb = _hexToRgbA(this.options.text_colour);

    this.options.percentage = $(document.createElement("div"))
      .html("<div></div><span></span>")
      .css({
        color: this.options.text_colour,
        "border-color": rgb
          ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7)`
          : this.options.text_colour
      })
      .addClass("jpreloader_percentage")
      .appendTo(this.options.overlay);

    this.options.percentage.children('div').css('border-left-color', this.options.text_colour);

    $(this.options.overlay).appendTo($(document.body));

    /**
     * TODO:
     * The mode check for things like Text & Scalable text
     * Add textloader functionality.
     * this.options.text_loader.style.marginLeft = this.options.text_loader.offsetWidth / 2 * -1;
     */

  }

  function loadPreloader() {
    let that = this;

    if (this.options.show_progress) {
      this.options.percentage.data("num", 0);
      const text = `0${this.options.show_percentage ? "%" : ""}`;
      this.options.percentage.children("span").text(text);
    }

    this.options.images.forEach((source, index) => {
      const finishedLoading = () => {
        loadingImage.call(that, source);
      };

      const image = new Image();
            image.src = source;

      if (image.complete) {
        finishedLoading();
      } else {
        image.onload = finishedLoading;
        image.onerror = finishedLoading;
      }
    });

    const timeout = this.options.images.length ? this.options.timeout * 1000 : 0;

    // timeout
    setTimeout(() => {
      if (this.options.overlay) {
        animatePercentage.call(that, this.options.percentage_loaded, 100);
      }
    }, timeout);

  }

  function loadingImage(image_src) {
    this.options.image_queue.push(image_src);

    if (this.options.image_queue.length && this.options.image_queue[0] === image_src) {
      reQueue.call(this);
    }
  }

  function reQueue() {
    // animate finish, remove item from the queue
    this.options.image_queue.splice(0, 1);
    // process queue
    processQueue.call(this);
  }

  function processQueue() {
    if (this.options.image_queue.length === 0) {
      return;
    }

    this.options.loaded++;

    animatePercentage.call(this, this.options.percentage_loaded, parseInt(100 * (this.options.loaded / this.options.total), 10));

    reQueue.call(this);
  }

  function loadFinish() {
    let that = this;

    transitionEnd(this.options.overlay, (e, element) => {
      if (that.options.overlay) {
        that.options.overlay.parentNode.removeChild(that.options.overlay);
        that.options.overlay = null;
      }
    });

    addClass(this.options.overlay, "complete");
    removeClass(document.body, "jpreloader");

    /**
     * TODO:
     * On Complete functionality as a callback to extend the api
     */

  }


  function animatePercentage(from, to) {
    this.options.percentage_loaded = from;

    let that = this;
    if (from < to) {
      from++;
      setTimeout(() => {
        if (that.options.show_progress) {
          const text = from + (that.options.show_percentage ? "%" : "");
          that.options.percentage.children("span").text(text);
        }

        animatePercentage.call(that, from, to);
      }, 5);

      if (from === 100) {
        loadFinish.call(this);
      }
    }
  }


  function _extendDefaults(source, properties) {
    let property;
    for (property in properties) {
      if (properties.hasOwnProperty(property)) {
        source[property] = properties[property];
      }
    }
    return source;
  }

  function _hexToRgbA(hex){
    let formula;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      formula = hex.substring(1).split("");
    if (formula.length == 3) {
      formula = [formula[0], formula[0], formula[1], formula[1], formula[2], formula[2]];
    }

    formula = `0x${formula.join("")}`;
      return `rgba(${[(formula>>16)&255, (formula>>8)&255, formula&255].join(",")},1)`;
    }

    throw new Error("Bad Hex");
  }

  function _hasClass(el, className) {
    if (el.classList)
      return el.classList.contains(className)
    else
      return !!el.className.match(new RegExp(`(\\s|^)${className}(\\s|$)`))
  }

  function addClass(el, className) {
    if (el.classList)
      el.classList.add(className)
    else if (!_hasClass(el, className)) el.className += ` ${className}`
  }

  function removeClass(el, className) {
    if (el.classList)
      el.classList.remove(className)
    else if (_hasClass(el, className)) {
      const reg = new RegExp(`(\\s|^)${className}(\\s|$)`);
      el.className=el.className.replace(reg, ' ')
    }
  }

}());
