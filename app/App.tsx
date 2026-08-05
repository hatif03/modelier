"use client";

import { fabric } from "fabric";
import { useEffect, useRef, useState } from "react";

import { useMutation, useRedo, useStorage, useUndo } from "@/liveblocks.config";
import {
  handleCanvaseMouseMove,
  handleCanvasMouseDown,
  handleCanvasMouseUp,
  handleCanvasObjectModified,
  handleCanvasObjectMoving,
  handleCanvasObjectScaling,
  handleCanvasSelectionCreated,
  handleCanvasZoom,
  handlePathCreated,
  initializeFabric,
  renderCanvas,
  clampZoom,
} from "@/lib/canvas";
import { handleDelete, handleKeyDown } from "@/lib/key-events";
import { LeftSidebar, Live, Navbar, RightSidebar } from "@/components/index";
import { handleImageUpload } from "@/lib/shapes";
import { defaultNavElement } from "@/constants";
import { ActiveElement, Attributes } from "@/types/type";

type Props = {
  width: number;
  height: number;
  projectId?: string;
  initialName?: string;
};

const Home = ({ width, height, projectId, initialName }: Props) => {
  /**
   * useUndo and useRedo are hooks provided by Liveblocks that allow you to
   * undo and redo mutations.
   *
   * useUndo: https://liveblocks.io/docs/api-reference/liveblocks-react#useUndo
   * useRedo: https://liveblocks.io/docs/api-reference/liveblocks-react#useRedo
   */
  const undo = useUndo();
  const redo = useRedo();

  /**
   * useStorage is a hook provided by Liveblocks that allows you to store
   * data in a key-value store and automatically sync it with other users
   * i.e., subscribes to updates to that selected data
   *
   * useStorage: https://liveblocks.io/docs/api-reference/liveblocks-react#useStorage
   *
   * Over here, we are storing the canvas objects in the key-value store.
   */
  const canvasObjects = useStorage((root) => root.canvasObjects);

  /**
   * canvasRef is a reference to the canvas element that we'll use to initialize
   * the fabric canvas.
   *
   * fabricRef is a reference to the fabric canvas that we use to perform
   * operations on the canvas. It's a copy of the created canvas so we can use
   * it outside the canvas event listeners.
   */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  /**
   * isDrawing is a boolean that tells us if the user is drawing on the canvas.
   * We use this to determine if the user is drawing or not
   * i.e., if the freeform drawing mode is on or not.
   */
  const isDrawing = useRef(false);

  /**
   * shapeRef is a reference to the shape that the user is currently drawing.
   * We use this to update the shape's properties when the user is
   * drawing/creating shape
   */
  const shapeRef = useRef<fabric.Object | null>(null);

  /**
   * selectedShapeRef is a reference to the shape that the user has selected.
   * For example, if the user has selected the rectangle shape, then this will
   * be set to "rectangle".
   *
   * We're using refs here because we want to access these variables inside the
   * event listeners. We don't want to lose the values of these variables when
   * the component re-renders. Refs help us with that.
   */
  const selectedShapeRef = useRef<string | null>(null);

  /**
   * activeObjectRef is a reference to the active/selected object in the canvas
   *
   * We want to keep track of the active object so that we can keep it in
   * selected form when user is editing the width, height, color etc
   * properties/attributes of the object.
   *
   * Since we're using live storage to sync shapes across users in real-time,
   * we have to re-render the canvas when the shapes are updated.
   * Due to this re-render, the selected shape is lost. We want to keep track
   * of the selected shape so that we can keep it selected when the
   * canvas re-renders.
   */
  const activeObjectRef = useRef<fabric.Object | null>(null);
  const isEditingRef = useRef(false);

  /**
   * zoom mirrors canvas.getZoom() into React state purely for the on-screen
   * percentage/controls — fabric itself doesn't emit a "zoom changed" event,
   * so every place that changes zoom (wheel, buttons) updates this too.
   */
  const [zoom, setZoom] = useState(1);

  /**
   * imageInputRef is a reference to the input element that we use to upload
   * an image to the canvas.
   *
   * We want image upload to happen when clicked on the image item from the
   * dropdown menu. So we're using this ref to trigger the click event on the
   * input element when the user clicks on the image item from the dropdown.
   */
  const imageInputRef = useRef<HTMLInputElement>(null);

  /**
   * activeElement is an object that contains the name, value and icon of the
   * active element in the navbar.
   */
  const [activeElement, setActiveElement] = useState<ActiveElement>({
    name: "",
    value: "",
    icon: "",
  });

  /**
   * elementAttributes is an object that contains the attributes of the selected
   * element in the canvas.
   *
   * We use this to update the attributes of the selected element when the user
   * is editing the width, height, color etc properties/attributes of the
   * object.
   */
  const [elementAttributes, setElementAttributes] = useState<Attributes>({
    width: "",
    height: "",
    fontSize: "",
    fontFamily: "",
    fontWeight: "",
    fill: "#aabbcc",
    stroke: "#aabbcc",
  });

  /**
   * deleteShapeFromStorage is a mutation that deletes a shape from the
   * key-value store of liveblocks.
   * useMutation is a hook provided by Liveblocks that allows you to perform
   * mutations on liveblocks data.
   *
   * useMutation: https://liveblocks.io/docs/api-reference/liveblocks-react#useMutation
   * delete: https://liveblocks.io/docs/api-reference/liveblocks-client#LiveMap.delete
   * get: https://liveblocks.io/docs/api-reference/liveblocks-client#LiveMap.get
   *
   * We're using this mutation to delete a shape from the key-value store when
   * the user deletes a shape from the canvas.
   */
  const deleteShapeFromStorage = useMutation(({ storage }, shapeId) => {
    /**
     * canvasObjects is a Map that contains all the shapes in the key-value.
     * Like a store. We can create multiple stores in liveblocks.
     *
     * delete: https://liveblocks.io/docs/api-reference/liveblocks-client#LiveMap.delete
     */
    const canvasObjects = storage.get("canvasObjects");
    canvasObjects.delete(shapeId);
  }, []);

  /**
   * deleteAllShapes is a mutation that deletes all the shapes from the
   * key-value store of liveblocks.
   *
   * delete: https://liveblocks.io/docs/api-reference/liveblocks-client#LiveMap.delete
   * get: https://liveblocks.io/docs/api-reference/liveblocks-client#LiveMap.get
   *
   * We're using this mutation to delete all the shapes from the key-value store when the user clicks on the reset button.
   */
  const deleteAllShapes = useMutation(({ storage }) => {
    // get the canvasObjects store
    const canvasObjects = storage.get("canvasObjects");

    // if the store doesn't exist or is empty, return
    if (!canvasObjects || canvasObjects.size === 0) return true;

    // delete all the shapes from the store
    for (const [key, value] of canvasObjects.entries()) {
      canvasObjects.delete(key);
    }

    // return true if the store is empty
    return canvasObjects.size === 0;
  }, []);

  /**
   * syncShapeInStorage is a mutation that syncs the shape in the key-value
   * store of liveblocks.
   *
   * We're using this mutation to sync the shape in the key-value store
   * whenever user performs any action on the canvas such as drawing, moving
   * editing, deleting etc.
   */
  const syncShapeInStorage = useMutation(({ storage }, object) => {
    // if the passed object is null, return
    if (!object) return;
    const { objectId } = object;

    /**
     * Turn Fabric object (kclass) into JSON format so that we can store it in the
     * key-value store.
     */
    let shapeData;
    try {
      shapeData = object.toJSON();
    } catch (err) {
      // A single shape's serialization failing (e.g. a programmatically
      // constructed object fabric's own toObject() doesn't fully expect)
      // should never take down the whole collaborative session.
      console.warn("syncShapeInStorage: object.toJSON() failed, skipping sync for this shape", err);
      return;
    }
    shapeData.objectId = objectId;

    // fabric's toJSON() only serializes its own known properties — anything
    // custom (objectId above, isPlaceholder/placeholderId for template
    // placeholders) has to be manually carried over the same way, or it's
    // silently dropped on the next room reload.
    if (object.isPlaceholder) {
      shapeData.isPlaceholder = true;
      shapeData.placeholderId = object.placeholderId;
    }

    const canvasObjects = storage.get("canvasObjects");
    /**
     * set is a method provided by Liveblocks that allows you to set a value
     *
     * set: https://liveblocks.io/docs/api-reference/liveblocks-client#LiveMap.set
     */
    canvasObjects.set(objectId, shapeData);
  }, []);

  /**
   * Set the active element in the navbar and perform the action based
   * on the selected element.
   *
   * @param elem
   */
  const handleActiveElement = (elem: ActiveElement) => {
    setActiveElement(elem);

    switch (elem?.value) {
      // delete all the shapes from the canvas
      case "reset":
        // clear the storage
        deleteAllShapes();
        // clear the canvas
        fabricRef.current?.clear();
        // set "select" as the active element
        setActiveElement(defaultNavElement);
        break;

      // delete the selected shape from the canvas
      case "delete":
        // delete it from the canvas
        handleDelete(fabricRef.current as any, deleteShapeFromStorage);
        // set "select" as the active element
        setActiveElement(defaultNavElement);
        break;

      // upload an image to the canvas
      case "image":
        // trigger the click event on the input element which opens the file dialog
        imageInputRef.current?.click();
        /**
         * set drawing mode to false
         * If the user is drawing on the canvas, we want to stop the
         * drawing mode when clicked on the image item from the dropdown.
         */
        isDrawing.current = false;

        if (fabricRef.current) {
          // disable the drawing mode of canvas
          fabricRef.current.isDrawingMode = false;
        }
        break;

      // for comments, do nothing
      case "comments":
        break;

      default:
        // set the selected shape to the selected element
        selectedShapeRef.current = elem?.value as string;
        break;
    }
  };

  // Zoom is pure CSS state applied to the page wrapper in Live.tsx — no
  // fabric canvas API calls at all, see lib/canvas.ts for why.
  const handleZoomIn = () => setZoom((z) => clampZoom(z + 0.1));
  const handleZoomOut = () => setZoom((z) => clampZoom(z - 0.1));
  const handleZoomReset = () => setZoom(1);

  useEffect(() => {
    // initialize the fabric canvas
    const canvas = initializeFabric({
      canvasRef,
      fabricRef,
      width,
      height,
    });

    /**
     * listen to the mouse down event on the canvas which is fired when the
     * user clicks on the canvas
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("mouse:down", (options) => {
      handleCanvasMouseDown({
        options,
        canvas,
        selectedShapeRef,
        isDrawing,
        shapeRef,
      });
    });

    /**
     * listen to the mouse move event on the canvas which is fired when the
     * user moves the mouse on the canvas
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("mouse:move", (options) => {
      handleCanvaseMouseMove({
        options,
        canvas,
        isDrawing,
        selectedShapeRef,
        shapeRef,
        syncShapeInStorage,
      });
    });

    /**
     * listen to the mouse up event on the canvas which is fired when the
     * user releases the mouse on the canvas
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("mouse:up", () => {
      handleCanvasMouseUp({
        canvas,
        isDrawing,
        shapeRef,
        activeObjectRef,
        selectedShapeRef,
        syncShapeInStorage,
        setActiveElement,
      });
    });

    /**
     * listen to the path created event on the canvas which is fired when
     * the user creates a path on the canvas using the freeform drawing
     * mode
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("path:created", (options) => {
      handlePathCreated({
        options,
        syncShapeInStorage,
      });
    });

    /**
     * listen to the object modified event on the canvas which is fired
     * when the user modifies an object on the canvas. Basically, when the
     * user changes the width, height, color etc properties/attributes of
     * the object or moves the object on the canvas.
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("object:modified", (options) => {
      handleCanvasObjectModified({
        options,
        syncShapeInStorage,
      });
    });

    /**
     * listen to the object moving event on the canvas which is fired
     * when the user moves an object on the canvas.
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas?.on("object:moving", (options) => {
      handleCanvasObjectMoving({
        options,
      });
    });

    /**
     * listen to the selection created event on the canvas which is fired
     * when the user selects an object on the canvas.
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("selection:created", (options) => {
      handleCanvasSelectionCreated({
        options,
        isEditingRef,
        setElementAttributes,
      });
    });

    /**
     * listen to the scaling event on the canvas which is fired when the
     * user scales an object on the canvas.
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("object:scaling", (options) => {
      handleCanvasObjectScaling({
        options,
        setElementAttributes,
      });
    });

    /**
     * listen to the mouse wheel event on the canvas which is fired when
     * the user scrolls the mouse wheel on the canvas.
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("mouse:wheel", (options) => {
      setZoom((current) => handleCanvasZoom(options as fabric.IEvent & { e: WheelEvent }, current));
    });

    /**
     * listen to the key down event on the window which is fired when the
     * user presses a key on the keyboard.
     *
     * We're using this to perform some actions like delete, copy, paste, etc when the user presses the respective keys on the keyboard.
     */
    window.addEventListener("keydown", (e) =>
      handleKeyDown({
        e,
        canvas: fabricRef.current,
        undo,
        redo,
        syncShapeInStorage,
        deleteShapeFromStorage,
      })
    );

    // dispose the canvas and remove the event listeners when the component unmounts
    return () => {
      /**
       * dispose is a method provided by Fabric that allows you to dispose
       * the canvas. It clears the canvas and removes all the event
       * listeners
       *
       * dispose: http://fabricjs.com/docs/fabric.Canvas.html#dispose
       */
      canvas.dispose();

      // remove the event listeners
      window.removeEventListener("keydown", (e) =>
        handleKeyDown({
          e,
          canvas: fabricRef.current,
          undo,
          redo,
          syncShapeInStorage,
          deleteShapeFromStorage,
        })
      );
    };
  }, [canvasRef]); // run this effect only once when the component mounts and the canvasRef changes

  // render the canvas when the canvasObjects from live storage changes
  useEffect(() => {
    renderCanvas({
      fabricRef,
      canvasObjects,
      activeObjectRef,
    });
  }, [canvasObjects]);

  // Capture a small preview a few seconds after each edit settles, so the
  // Dashboard can show a real snapshot of the design (Canva-style) instead
  // of a blank tile. Debounced and non-fatal — a canvas that's briefly
  // tainted by a cross-origin image without CORS just skips this round.
  useEffect(() => {
    if (!projectId) return;
    const timer = setTimeout(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      try {
        const dataUrl = canvas.toDataURL({ format: "png", multiplier: 0.3 });
        fetch(dataUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const form = new FormData();
            form.set("thumbnail", blob, "thumbnail.png");
            return fetch(`/api/projects/${projectId}/thumbnail`, { method: "PUT", body: form });
          })
          .catch(() => {});
      } catch {
        // tainted canvas — skip, next edit's capture will likely succeed
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [canvasObjects, projectId]);

  return (
    <main className='h-screen overflow-hidden'>
      <Navbar
        imageInputRef={imageInputRef}
        activeElement={activeElement}
        projectId={projectId}
        initialName={initialName}
        handleImageUpload={(e: any) => {
          // prevent the default behavior of the input element
          e.stopPropagation();

          handleImageUpload({
            file: e.target.files[0],
            canvas: fabricRef as any,
            shapeRef,
            syncShapeInStorage,
          });
        }}
        handleActiveElement={handleActiveElement}
      />

      <section className='flex h-full flex-row'>
        <LeftSidebar
          allShapes={Array.from(canvasObjects)}
          fabricRef={fabricRef}
          shapeRef={shapeRef}
          activeObjectRef={activeObjectRef}
          syncShapeInStorage={syncShapeInStorage}
          deleteShapeFromStorage={deleteShapeFromStorage}
          deleteAllShapes={deleteAllShapes}
        />

        <Live
          canvasRef={canvasRef}
          undo={undo}
          redo={redo}
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
        />

        <RightSidebar
          elementAttributes={elementAttributes}
          setElementAttributes={setElementAttributes}
          fabricRef={fabricRef}
          isEditingRef={isEditingRef}
          activeObjectRef={activeObjectRef}
          syncShapeInStorage={syncShapeInStorage}
        />
      </section>
    </main>
  );
};

export default Home;
