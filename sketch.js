let inputFile;
let img;
let circles;
let dimensions = {};
const diameter = 10
let dragging = -1
let ratio

function setup() {
    createCanvas(400, 400);
    inputFile = createFileInput(handleFile)
    inputFile.parent('input')
    inputFile.class('form-control')
    let button = createButton('Get contour');
    button.mousePressed(() => getContours(img.elt));
    button.parent('actions')
    button.id('contour')
    button.class('btn btn-primary me-2 disabled')
    let button2 = createButton('Get data');
    button2.mousePressed(() => getCsv());
    button2.parent('actions')
    button2.class('btn btn-primary disabled')
    button2.id('data')
    // loadImage('IMG_0297.JPG', _img => {
    //     img = _img
    // });

    circles = [
        {
            x: 10, y: 10
        },
        {
            x: 100, y: 10
        },
        {
            x: 100, y: 100
        },
        {
            x: 10, y: 100
        },
    ]
}

const toggleLoading = (status) => {
    const spinner = document.getElementById('spinner')
    
    if(status){
        if(spinner.classList.contains('d-none')){
            spinner.classList.remove('d-none')
        }
    }
    else {
        if(!spinner.classList.contains('d-none')){
            spinner.classList.add('d-none')
        }
    }
}

function draw() {
    background(255);
    if (img) {

        if (!ratio) {
            ratio = img.width / img.height
        }

        let newWidth = img.width
        let newHeight = img.height

        if (windowWidth < newWidth) {
            newWidth = windowWidth
            newHeight = windowWidth / ratio

            if (newHeight > windowHeight) {
                newHeight = windowHeight
                newWidth = newHeight * ratio
            }
        }

        if (windowHeight < newHeight) {
            newHeight = windowHeight
            newWidth = newHeight * ratio
        }

        if (width != newWidth && height != newHeight) {
            resizeCanvas(newWidth, newHeight)
        }

        background(200)
        image(img, 0, 0, width, height);
        drawSelect()
        drawCorners()
    }
}

function drawSelect() {
    fill('rgba(0,0,0,0.5)');

    quad(
        circles[0].x, circles[0].y,
        circles[1].x, circles[1].y,
        circles[2].x, circles[2].y,
        circles[3].x, circles[3].y);
}

function drawCorners() {
    fill(255)
    stroke(0)
    strokeWeight(1)

    if (dragging > -1) {
        circles[dragging].x = mouseX
        circles[dragging].y = mouseY
    }

    for (let index = 0; index < circles.length; index++) {
        let circleCorner = circles[index]
        circle(circleCorner.x, circleCorner.y, diameter);

    }
}

function handleFile(file) {
    if (file.type === 'image') {
        img = createImg(file.data, '');
        // console.log(img);
        // let clone = {
        //     width: img.width,
        //     height: img.height
        // }
        // let clone2 = JSON.parse(JSON.stringify(clone));
        // console.log(clone2);
        // // dimensions.width = clone.width
        // // dimensions.height = clone.height
        // // img.position(0,0)
        // // img.style("opacity", "0")
        img.hide()
        document.getElementById('contour').classList.remove('disabled')
    } else {
        img = null;
    }
}


function mousePressed() {
    //check if mouse is over the ellipse
    for (let index = 0; index < circles.length; index++) {
        let circleCorner = circles[index]
        if (dist(circleCorner.x, circleCorner.y, mouseX, mouseY) < diameter) {
            dragging = index;
            return
        }
    }
}

function mouseReleased() {
    dragging = -1;
}

const getAdjustedRatio = () => min(width / img.width, height / img.height)

const handleContours = (contours) => {

    let adjustedRatio = getAdjustedRatio()
    document.getElementById('data').classList.remove('disabled')
    for (let index = 0; index < contours.length; index++) {
        const contourPoints = contours[index][0];
        circles[index].x = contourPoints[0] * adjustedRatio
        circles[index].y = contourPoints[1] * adjustedRatio
    }
}

const getContours = () => {
    const file = document.querySelector("input[type=file]").files[0];
    const formData = new FormData();
    formData.append("file", file);
    toggleLoading(true)
    fetch('http://127.0.0.1:5000/receive', {
        method: 'POST',
        body: formData,
    }).then(res => res.json())
        .then(res => {
            handleContours(res.contours)
            toggleLoading(false)
    }).catch(() => {
        toggleLoading(false)
    })
}

const getCsv = () => {
    let adjustedRatio = getAdjustedRatio()
    let contours = circles.map(circle => {
        return `${circle.x / adjustedRatio},${circle.y / adjustedRatio}`
    })
    let joined = contours.join(",")
    const file = document.querySelector("input[type=file]").files[0];
    let formData = new FormData();
    formData.append("file", file);
    formData.append("contours", joined)
    toggleLoading(true)
    fetch('http://127.0.0.1:5000/csv_file', {
        method: 'POST',
        body: formData,
    }).then(res => res.json())
        .then(res => {
            toggleLoading(false)
            let length = Object.keys(res.Total).length;
            let tbody = document.querySelector("table tbody")
            tbody.innerHTML = '';
            let total = Object.values(res.Total).reduce((acc,curr) => acc + curr, 0)
            console.log(total);
            document.getElementById('total').textContent = Math.round(total * 100) / 100
            for(let i = 0; i < length; i++){

                let row = document.createElement("tr")

                let nomeCol = document.createElement("td")
                nomeCol.innerText = res.Name[i]
                row.appendChild(nomeCol)
                
                let valorCol = document.createElement("td")
                valorCol.innerText = Math.round(res.Value[i] * 100) / 100
                row.appendChild(valorCol)
                
                let descontoCol = document.createElement("td")
                descontoCol.innerText = Math.round(res.Desconto[i] * 100) / 100
                row.appendChild(descontoCol)

                let totalCol = document.createElement("td")
                totalCol.innerText = Math.round(res.Total[i] * 100) / 100
                row.appendChild(totalCol)
                
                tbody.appendChild(row)
            }
            
        }).catch(() => toggleLoading(false))
}
