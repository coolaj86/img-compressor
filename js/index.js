const $ = (sel, el) => {
  return (el || document.body).querySelector(sel);
}

const MIME_TYPE = "image/jpeg";
let MAX_WIDTH = 320;
let MAX_HEIGHT = 180;
let quality = parseFloat($('select[name="image-quality"]').value, 10);
let selectedDimension;
let dimensionPixels;
let smoothingOptions;

const input = $('input[name="img-input"]');
const qualitySelector = $('select[name="image-quality"]');
const settingsButton = $('button[name="js-settings-button"]')
const settingsForm = $('form[class="js-settings-form"]')
const dimensionPixelInput = $('input[name="js-dimension-pixels"]')
const smoothingSelector = $('select[name="smoothing-options"]')

const calculateSize = (img, maxWidth, maxHeight, selectedDimension, dimensionPixels) => {
  let width = img.width;
  let height = img.height;
  // calculate the width and height, constraining the proportions
  if (selectedDimension === "width" && dimensionPixels != undefined && !isNaN(dimensionPixels)) {
    if (width > maxWidth) {
      height = Math.round((height * dimensionPixels) / width);
      width = dimensionPixels;
    }
  } else if (selectedDimension === "height" && dimensionPixels != undefined && !isNaN(dimensionPixels)) {
    width = Math.round((width * dimensionPixels) / height);
    height = dimensionPixels;
  } else {
    if (width > height) {
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
    }
  }
  return [width, height];
}

const displayInfo = (label, file) => {
  const p = document.createElement("p");
  p.innerText = `${label} - ${readableBytes(file.size)}`;
  $(".js-images-container").append(p);
}

const displayDownloadLink = (linkText, blobData) => {
  var downloadLink = document.createElement("a");
  downloadLink.innerText = linkText;
  let url = URL.createObjectURL(blobData);
  downloadLink.href = url;
  downloadLink.download = url;
  $(".js-images-container").append(downloadLink)
}

const readableBytes = (bytes) => {
  const i = Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
}

const insertBreak = () => {
  let breakElement = document.createElement("br");
  $(".js-images-container").append(breakElement)
}

const toggleElement = (element) => {
  if (element.style.display === "none") {
    element.style = ""
  } else if (element.style.display === "") {
    element.style = "display: none"
  }
}
// This is the only function in the JS file that is called in the HTML element. 
// This syntax was much cleaner than the equivalent JS only syntax
const handleRadioClick = (element) => {
  selectedDimension = element.value;
}

/* Settings Events */
settingsButton.onclick = () => {
  toggleElement(settingsForm)
  if (settingsButton.innerText === "Show Settings") {
    settingsButton.innerText = "Hide Settings"
  } else if (settingsButton.innerText === "Hide Settings") {
    settingsButton.innerText = "Show Settings"
  }
}

qualitySelector.onchange = (event) => {
  event.preventDefault();
  quality = parseFloat(event.target.value, 10);
}

smoothingSelector.onchange = (event) => {
  event.preventDefault();
  smoothingOptions = event.target.value;
}

dimensionPixelInput.onchange = (event) => {
  event.preventDefault();
  dimensionPixels = parseFloat(event.target.value, 10);
}

/* End of Settings Events */
input.onchange = (event) => {
  const file = event.target.files[0]; // get the file
  const blobURL = URL.createObjectURL(file);
  const img = new Image();
  img.src = blobURL;

  img.onerror = () => {
    URL.revokeObjectURL(this.src);
    // TODO: Handle the failure properly
    alert("Cannot load image");
  };

  img.onload = () => {
    URL.revokeObjectURL(this.src);
    const [newWidth, newHeight] = calculateSize(img, MAX_WIDTH, MAX_HEIGHT, selectedDimension, dimensionPixels);
    const canvas = document.createElement("canvas");
    canvas.width = newWidth;
    canvas.height = newHeight;

    const context = canvas.getContext("2d");
    const canvas2 = document.createElement("canvas");
    const context2 = canvas2.getContext("2d")
    canvas2.height = newHeight * 0.5;
    canvas2.width = newWidth * 0.5;

    if (smoothingOptions === 'bi-linear') {
      context.drawImage(img, 0, 0, newWidth, newHeight);
    } else {
      // faux bi-cubic image smoothing 
      context2.drawImage(img, 0, 0, canvas2.width, canvas2.height);
      context2.drawImage(img, 0, 0, canvas2.width * 0.5, canvas2.height * 0.5);
      context.drawImage(canvas2, 0, 0, canvas2.width * 0.5, canvas2.height * 0.5, 0, 0, canvas.width, canvas.height);
    }
    canvas.toBlob(
      (blob) => {
        // Handle the compressed images. upload or save in local state
        displayInfo("Original file", file);
        displayInfo("Compressed file", blob);
        displayDownloadLink("Download Minified Image", blob);
        insertBreak();
      },
      MIME_TYPE,
      quality
    );
    $(".js-images-container").append(canvas);
    input.value = "";
  };
};

