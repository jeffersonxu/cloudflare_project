/*
Jefferson Xu
Project: Cloudflare Workers Internship Application: Full-Stack
*/

//Class that replaces the href attribute
class editURL {
  constructor(attributeName) {
    this.attributeName = attributeName,
    this.buffer = ''
  }

  element(element) {
    const attribute = element.getAttribute(this.attributeName)
    if (attribute) {
        element.setAttribute(
            this.attributeName,
            attribute.replace('https://cloudflare.com', 'http://jeffersonxu.com/')
        )
    }
  }
}

//Class that takes in two parameters: a text to search for and a text to replace that search with
class Replacer{
    constructor(textMatch, textReplace){
        this.textMatch = textMatch,
        this.textReplace = textReplace,
        this.buffer = ''
    }
    text(text){
        this.buffer += text.text
        if(text.lastInTextNode){
            text.replace(this.buffer.replace(this.textMatch, this.textReplace))
            this.buffer = ''
        } else
            text.remove()
    }
}

//HTMLRewriter instantiation to edit variant page
const rewriter = new HTMLRewriter()
  .on('a', new editURL('href'))
  .on('a', new Replacer("Return to cloudflare.com", "Let's go to http://jeffersonxu.com/ :)"))
  .on('h1#title', new Replacer("Variant ", "Corgi #"))
  .on('p#description', new Replacer(" of the take home project!", ". Can't believe this Replacer class actually works"))


addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
    const response = await fetch(
        "https://cfw-takehome.developers.workers.dev/api/variants",
        { 'content-type': 'application/json'}
    )

    const variants = (await gatherResponse(response))['variants'];

    //A/B testing
    const NAME = 'variant_experiment'
    const VARIANT_ONE = new Response('Variant 1')
    const VARIANT_TWO = new Response('Variant 2')
    const cookie = request.headers.get('cookie')

    if (cookie && cookie.includes(`${NAME}=variant1`))
        return VARIANT_ONE
    else if (cookie && cookie.includes(`${NAME}=variant2`))
        return VARIANT_TWO
    else {
        let randIndex = Math.random() < 0.5 ? 0 : 1
        let group = randIndex == 0 ? 'variant1' : 'variant2'
        let res = group == 'variant1' ? VARIANT_ONE : VARIANT_TWO

        //I was not able to figure out how to set my cookie properly for each variant
        //However, I still wanted to give it a shot though
        let result = await fetch(variants[randIndex], {
            headers: {
                'content-type': 'text/html;charset=UTF-8',
                'set-cookie': `${NAME}=${group}`
            }
        })

        return rewriter.transform(result)
    }
}

async function gatherResponse(response) {
    const { headers } = response
    const contentType = headers.get('content-type')
    if (contentType.includes('application/json'))
        return await response.json()
    return await response.text()
}