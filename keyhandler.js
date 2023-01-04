/**
 * An independent keyhandler module.
 * Provides raw keycodes somewhere. 
 *
 * Use KeyHandler.initialize() to start.
 * By default, it attaches itself to the <body>, but that can be changed with KeyHandler.setAttachedElement(element), 
 *     even after initialization.
 */
var KeyHandler = (
	function()
	{
		var isInitialized = false;
		var attachedElement;
		var keysPressed = {};
		
		var onkeydown;
		var onkeyup;
		
		// won't work if element is in iframe
		function isHTMLElement(object)
		{
			return object instanceof Element;
		}
		
		return {
			get keysPressed() { return keysPressed },
			
			initialize: function()
			{
				if(isInitialized) return;
				isInitialized = true;
				// we don't use a const for the default because we cannot be sure of the loading time;
				// on initialization, it's safe to assume that the body is loaded at least. that is not certain when we first parse the js though.
				if(!isHTMLElement(attachedElement) || !attachedElement) attachedElement = document.body;
				
				console.log(this);
				
				attachedElement.addEventListener("keydown",this.handleKeydown, false);
				attachedElement.addEventListener("keyup",this.handleKeyup, false);
			},
			
			/**
			 * Changes the element the listener is attached to a different one.
			 * ~semi-tested
			 * @param the new DOM element
			 */
			setAttachedElement: function(element)
			{
				if(!element) return;
				if(!attachedElement) 
				{
					attachedElement = element;
				}
				else 
				{
					// first, we must remove the listeners
					attachedElement.removeEventListener("keydown",this.handleKeydown, false);
					attachedElement.removeEventListener("keyup",this.handleKeyup, false);
					// then readd them to the new element
					attachedElement = element;					
					attachedElement.addEventListener("keydown",this.handleKeydown, false);
					attachedElement.addEventListener("keyup",this.handleKeyup, false);
				}
			},
			
			setOnKeydown: function(handler)
			{
				onkeydown = handler;
			},
			
			setOnKeyup: function(handler)
			{
				onkeyup = handler;
			},
			
			handleKeydown: function(keyevent)
			{
				var keycode = keyevent.keyCode;
				keysPressed[keycode] = true;
				if(onkeydown) onkeydown(keycode);
				return keycode;
			},
			
			handleKeyup: function(keyevent)
			{
				var keycode = keyevent.keyCode;
				keysPressed[keycode] = false;
				if(onkeyup) onkeyup(keycode);
				return keycode;
			},
		}
	}
)();
