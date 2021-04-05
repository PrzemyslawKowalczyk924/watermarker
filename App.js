const Jimp = require('jimp');
const inquirer = require('inquirer');
const fs = require('fs');

const addTextWatermarkToImage = async function(inputFile, outputFile, text) {
  try {
    const image = await Jimp.read(inputFile);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const textData = {
      text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    };
    image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
    await image.quality(100).writeAsync(outputFile);
  } catch {
    console.log('Something went wrong... Try again!');
  }
};

const addImageWatermarkToImage = async function(inputFile, outputFile, watermarkFile) {
  try {
    const image = await Jimp.read(inputFile);
    const watermark = await Jimp.read(watermarkFile);
    const x = image.getWidth() / 2 - watermark.getWidth() / 2;
    const y = image.getHeight() / 2 - watermark.getHeight() / 2;
  
    image.composite(watermark, x, y, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.5,
    });
    await image.quality(100).writeAsync(outputFile);
  } catch {
    console.log('Something went wrong... Try again!');
  }
};

const prepareOutputFilename = (filename) => {
  const [ name, ext ] = filename.split('.');
  return `${name}-with-watermark.${ext}`;
};

const prepareOutputFilenameIfEdited = (filename) => {
  const [ name, ext ] = filename.split('.');
  return `${name}-edited.${ext}`;
};

const makeImageBrighter = async function(inputFile, outputFile, brightness) {
  const img = await Jimp.read(inputFile);
  img.brightness(Number(brightness.value));
  
  await img.quality(100).writeAsync(outputFile);
  console.log('Image with adjusted brightness successfully created!');
}

const makeImageContrast = async function(inputFile, outputFile, contrast) {
  const img = await Jimp.read(inputFile);
  img.contrast(Number(contrast.value));
  
  await img.quality(100).writeAsync(outputFile);
  console.log('Image with adjusted contrast successfully created!');

}

const startApp = async () => {

  // Ask if user is ready
  const answer = await inquirer.prompt([{
      name: 'start',
      message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
      type: 'confirm'
    }]);

  // if answer is no, just quit the app
  if(!answer.start) process.exit();

  // ask about input file and watermark type
  const options = await inquirer.prompt([{
    name: 'inputImage',
    type: 'input',
    message: 'What file do you want to mark?',
    default: 'test.jpg',
  }, {
    name: 'watermarkType',
    type: 'list',
    choices: ['Text watermark', 'Image watermark'],
  }]);

  const fileExists = fs.existsSync('./img/' + options.inputImage);

  const askUser = await inquirer.prompt([{
    name: 'edit',
    message: 'Would you like to edit image before adding a watermark?',
    type: 'confirm'
  }]);

  if(askUser.edit) {
    const listofEditChoices = await inquirer.prompt([{
      name: 'editName',
      message: 'What would you like to do?',
      type: 'list',
      choices: ['make image brighter', 'increase contrast', 'make image b&w', 'invert image', 'exit']
    }
  ])

    switch (listofEditChoices.editName) {
      case 'make image brighter':
        const brightness = await inquirer.prompt([{
          name: 'value',
          type: 'input',
          message: 'adjust the brightness by a value -1 to +1 for example (.4) or (-.2)',
          //default: 0.5,
        }]);
        makeImageBrighter('./img/' + options.inputImage, prepareOutputFilenameIfEdited(options.inputImage), brightness);
        break;
      case 'increase contrast':
        const contrast = await inquirer.prompt([{
          name: 'value',
          type: 'input',
          message: 'adjust the contrast by a value -1 to +1 for example (.4) or (-.2)',
          //default: 0.5,
        }]);
        makeImageContrast('./img/' + options.inputImage, prepareOutputFilenameIfEdited(options.inputImage), contrast);
        break;
      case 'make image b&w':
        console.log('make image b&w');
        break;
      case 'invert image':
        console.log('invert image');
        break;
      case 'exit':
        break;      
      default:
        console.log('Something went wrong');
    }

  }
  

  if(options.watermarkType === 'Text watermark') {
    const text = await inquirer.prompt([{
      name: 'value',
      type: 'input',
      message: 'Type your watermark text:',
    }]);
    options.watermarkText = text.value;
    
    if (fileExists) {
      addTextWatermarkToImage('./img/' + options.inputImage, './img/' + prepareOutputFilename(options.inputImage), options.watermarkText);
      console.log('Text Watermark done!');
      startApp();
    } else {
      console.log(`The file ${options.inputImage} dont exist!`);
    };
  }
  else {
    const image = await inquirer.prompt([{
      name: 'filename',
      type: 'input',
      message: 'Type your watermark name:',
      default: 'logo.png',
    }]);
    options.watermarkImage = image.filename;
    if (fileExists && fs.existsSync('./img/' + options.watermarkImage)) {
      addImageWatermarkToImage('./img/' + options.inputImage, './img/' + prepareOutputFilename(options.inputImage), './img/' + options.watermarkImage);
      console.log('Image Watermark done!');
    } else {
      console.log('Something went wrong... Try again!');
    }
  }
}

startApp();
