
const API_URL = "https://cfw-takehome.developers.workers.dev/api/variants"

// Page with error message.
const errorPage =  `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Todos</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss/dist/tailwind.min.css" rel="stylesheet"></link>
    </head>
  
    <body class="bg-blue-100">
      <div class="w-full h-full flex content-center justify-center mt-8">
        <div class="bg-white shadow-md rounded px-8 pt-6 py-8 mb-4">
          <h1 class="align-center block text-grey-800 text-md font-bold mb-2">Error while fetching variants data</h1>
          <div class="flex">
            <a href="https://ganeshkurcheti.com"><button class="green-button hover:bg-blue-dark text-white font-bold ml-2 py-2 px-4 rounded focus:outline-none focus:shadow-outline"  type="submit">Please visit my portfolio (https://ganeshkucheti.com)</button></a>
          </div>
          <div class="mt-4" id="todos"></div>
        </div>
      </div>
    </body>
  </html>
  <style>
  .align-center{
    text-align:center;
  }
  .green-button{
    background:green
  }
  </style>
  `
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})


/**
 * Respond with with the variant page content
 * @param {Request} request
 */
async function handleRequest(request) {
  // Fetch from the variants url from cookie.
  const cookieValue = checkAndReturnCookie(request, "rendered-variant")
  var variantPage = cookieValue;
  // If cookie value is null then fetch from API.
  if(!variantPage){
    let apiResponse = await fetch(API_URL).then(function(response) {
      if (response.status !== 200 ) {
        console.log("Variants fetching error, please make sure the https://cfw-takehome.developers.workers.dev/api/variants is returnig the value : " + response.status)
        return "error"
      } 
      return response.json()
    });
    // If error in API render error page. 
    if(apiResponse == "error"){
      return new Response(errorPage, {
        headers: { 'Content-Type': 'text/html' },
      })
    }
    var urls = apiResponse["variants"]
    variantPage = urls[selectRandomVariant(urls)];
  }

  //Get content from the API
  var variantPageContent = await fetch(variantPage).then(response => response.text());

  // Using rewriter to change the content.
  var rewritter = new HTMLRewriter()
  .on('a#url', {
    element(element) {
      if (element.hasAttribute("href")){
        element.setAttribute("href", "http://ganeshkurcheti.com")
      }
      element.setInnerContent("Please visit my portfolio hosted with Cloudfare. Thanks")
    }
  })
  .on('p#description', {
    element(element) {
      element.setInnerContent("Hi I am Naga Ganesh Singh Kurcheti. Please visit my opensource projects at https://github.com/GaneshKurcheti")
    }
  })
  .on('title', {
    element(element) {
      element.setInnerContent("2 years of experience in full stack development")
    }
  })
  .on('h1#title', {
    element(element) {
      if (variantPage.includes('1')) {
        element.setInnerContent("You are visiting Variant 1")
      } else {
        element.setInnerContent("You are visiting Variant 2")
      }
    }
  })

  let finalResponse = new Response(variantPageContent, {
    "headers": {
      "Content-Type": "text/html",
      "Set-Cookie": "rendered-variant=" + variantPage + "; SameSite=Strict",
    },
    "credentials": "same-origin"
  })
  return rewritter.transform(finalResponse);
}

/**
 *  Get random variant.
 * @param {string[]} urls
 */
function selectRandomVariant(urls){
  return Math.random() < 0.5 ? 0 : 1;
}


/**
 *  check and returns value of cookie if cookie is present 
 * @param {string[]} urls
 */
function checkAndReturnCookie(request, name) {
  let result = null
  let cookieString = request.headers.get('Cookie')
  if (cookieString) {
    let cookies = cookieString.split(';')

    cookies.forEach(cookie => {
      let cookieName = cookie.split('=')[0].trim()
      
      if (cookieName === name) {
        let cookieVal = cookie.split('=')[1]
        result = cookieVal
      }
    })
  }

  return result
}