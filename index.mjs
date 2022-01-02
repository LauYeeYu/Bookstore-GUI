import koa from 'koa'
import Router from '@koa/router'
import bodyparser from 'koa-body'
import { createInterface } from 'readline'
import { spawn } from 'child_process'
import request from 'koa/lib/request'

const app = new koa()
const router = new Router()
app.use(bodyparser()).use(router.routes()).use(router.allowedMethods())

const escape = str => str
    .replace(/</g, '&lt')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const proc = spawn('./Bookstore')
const s = createInterface({ input: proc.stdout })
const queue = []

// 读流读到东西的时候从 queue 头取出一个函数，把读到的东西给他
s.on('line', line => {
    if (queue.length === 0) buffer.push(line) 
    else queue.shift()(line)
})
// 如何给它写进去参数
const putline = line => proc.stdin.write(line + '\n')
// 如何读一个东西
const getline = () => {
    if (buffer.length === 0) return new Promise(resolve => queue.push(resolve))
    else return buffer.shift()
}

const buffer = []

let ID = ''
let priority = 0

router.get('/', async ctx => {
    if (priority === 0) {
        ctx.body = `
        <html>
        <head>
            <meta charset="UTF-8">
            <link rel="stylesheet" href="styles.css">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bookstore</title>
        </head>
        <body>
            <main>
                <h1>Welcome to bookstore</h1>
                <div class="centre">
                    <form action="/login" method="post">
                        <p>Your ID: <input name="ID"></p>
                        <p>Your password: <input name="password" type="password"></p>
                        <button type="submit">Submit</button>
                    </form>
                </div>
            </main>
        </body>
        </html>
        `
    } else {
        ctx.redirect(redirectMap[priority])
    }
})

router.get('/user', ctx => {
    if (priority !== 1) {
        ctx.redirect(redirectMap[priority])
        return
    }
    ctx.body = `
    <html>
    <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="styles.css">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>User - Bookstore</title>
    </head>
    <body>
        <main>
            <nav>
                <span>Hello, ${ID}!</span>
                <a href="/">Main page</a>
                <a href="/show-single">Find book</a>
                <a href="/change-password">Change password</a>
                <a href="/logout">Logout</a>
            </nav>
            <h1>Book List</h1>
            <div class="centre">
                <form action="/buy" method="post">
                    <p>ISBN: <input name="ISBN"></p>
                    <p>Quantity: <input name="quantity"></p>
                    <button type="buy">Buy</button>
                </form>
            </div>
        </main>
    </body>
    </html>
    `
})

router.get('/show-single', ctx => {
    putline('show')
    ctx.redirect('/show')
})

router.get('/logout', ctx => {
    putline('logout')
    ID = ''
    priority = 0
    ctx.redirect('/')
})

router.get('/show', async ctx => {
    const num = await getline()
    if (num === 'Invalid') {
        ctx.redirect('/')
        return
    }
    ctx.body = `
    <html>
    <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="styles.css">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>User - Bookstore</title>
    </head>
        <main>
            <body>
                <nav>
                    <span>Hello, ${ID}!</span>
                    <a href="/">Main page</a>
                    <a href="/show-single">Find book</a>
                    <a href="/change-password">Change password</a>
                    <a href="/logout">Logout</a>
                </nav>

                <form action="/show-with-character" method="post">
                    <select name="type" id="pet-select">
                        <option value="">-Choose an option-</option>
                        <option value="ISBN">ISBN</option>
                        <option value="name">name</option>
                        <option value="author">author</option>
                        <option value="keyword">keyword</option>
                    </select>
                    <input name="token">
                    <button type="search">Search</button>
                </form>
                <table border="1" class="centre">
                    <tr>
                        <th>ISBN</th>
                        <th>Name</th>
                        <th>Author</th>
                        <th>Keyword</th>
                        <th>Price</th>
                        <th>Quantity</th>
                    </tr>
            
    `

    for (let i = 0; i < num; i++) {
        const [ ISBN, Name, Author, Keyword, Price, Quantity ] = (await getline()).split('\t')
        ctx.body += `
        <tr>
            <td>${ISBN}</td>
            <td>${Name}</td>
            <td>${Author}</td>
            <td>${Keyword}</td>
            <td>${Price}</td>
            <td>${Quantity}</td>
        <tr>
        `
    }

    ctx.body += `
            </table>
        </main>
    </body>
    </html>
    `
})

router.get('/styles.css', ctx => {
    ctx.body = `
    /* reset */
            * { margin: 0; padding: 0; box-sizing: border-box; }
            img { border: none; }
            table { border-collapse: collapse; }
            a {
                text-decoration: none;
                margin: 0 16px;
            }
            a:hover, a:active, a:focus { text-decoration: underline; }

            ol, ul { margin-left: 2em; }

            body {
                padding: 16px;
                padding-bottom: 64px;
                min-height: 100vh;
                text-align: center;
                background-color: #fcfffc;
                color: #222;
                border-top: 4px solid #56d66f;
            }
            main {
                padding-top: 64px;
                text-align: start;
                display: inline-block;
                max-width: 1080px;
            }

            blockquote { padding-left: 2rem; position: relative; }
            blockquote::before {
                content: '“';
                position: absolute;
                font-size: 3rem;
                line-height: 3.125rem;
                font-weight: 400;
                right: calc(100% - 1.75rem);
                top: 0;
                color: rgba(0, 0, 255, .5);
            }

            /* typography */
            h1, h2, h3, h4, h5, h6, main, .subtitle1, .subtitle2, .body2, caption, button, .button, .overline {
                -moz-osx-font-smoothing: grayscale;
                -webkit-font-smoothing: antialiased;
                font-family: Roboto, sans-serif;
                text-decoration: inherit;
                text-transform: inherit;
            }
            h1 {
                font-size: 4.25rem;
                line-height: 5rem;
                padding: 2rem 0;
                font-weight: 200;
                letter-spacing: -0.015625em;
                position: relative;
            }
            h2 {
                font-size: 3.25rem;
                line-height: 3.25rem;
                padding: 1.25rem 0;
                font-weight: 200;
                letter-spacing: -0.0083333333em;
            }
            h3 {
                font-size: 2.75rem;
                line-height: 3.125rem;
                padding: 1rem 0;
                font-weight: 200;
                letter-spacing: normal;
            }
            h4 {
                font-size: 2.125rem;
                line-height: 2.5rem;
                padding: 0.75rem 0;
                font-weight: 400;
                letter-spacing: 0.0073529412em;
            }
            h5 {
                font-size: 1.5rem;
                line-height: 2rem;
                padding: 0.5rem 0;
                font-weight: 400;
                letter-spacing: normal;
            }
            h6 {
                font-size: 1.25rem;
                line-height: 2rem;
                font-weight: 500;
                letter-spacing: 0.0125em;
            }
            .subtitle1 {
                font-size: 1rem;
                line-height: 1.75rem;
                font-weight: 400;
                letter-spacing: 0.009375em;
            }
            .subtitle2 {
                font-size: 0.875rem;
                line-height: 1.375rem;
                font-weight: 500;
                letter-spacing: 0.0071428571em;
            }
            main {
                font-size: 1rem;
                line-height: 1.5rem;
                font-weight: 400;
                letter-spacing: 0.03125em;
            }
            p, li { padding: 0.25rem 0; }
            .body2 {
                font-size: 0.875rem;
                line-height: 1.25rem;
                font-weight: 400;
                letter-spacing: 0.0178571429em;
            }
            caption {
                font-size: 0.75rem;
                line-height: 1.25rem;
                font-weight: 400;
                letter-spacing: 0.0333333333em;
            }
            button, .button {
                font-size: 0.875rem;
                line-height: 2.25rem;
                font-weight: 500;
                letter-spacing: 0.0892857143em;
                text-transform: uppercase;
            }
            .overline {
                font-size: 0.75rem;
                line-height: 2rem;
                font-weight: 500;
                letter-spacing: 0.1666666667em;
                text-transform: uppercase;
            }
            .centre {
                text-align: center;
            }

            @media (prefers-color-scheme: dark) {
            body {
                background-color: #121212;
                color: rgba(255, 255, 255, .8)
            }
            blockquote::before { color: rgba(127, 127, 255, .6); }
            a { color: #3391ff; }
            a:visited { color: #cc91ff; }
            }

            @media (min-width: 1500px) {
                main {
                    display: block;
                    margin-left: 194px;
                }
            }`
})

const redirectMap = {
    1: '/user',
    3: '/employee',
    7: '/root',
}

router.post('/login', async ctx => {
    ID = ctx.request.body?.ID
    const password = ctx.request.body?.password
    putline(`su ${ID} ${password}`)
    const result = await getline()
    if (result === 'Invalid') {
        ID = ''
        priority = 0
        ctx.redirect('/')
    } else if ([ '1', '3', '7' ].includes(result)) {
        priority = Number(result)
        ctx.redirect(redirectMap[result])
    }
})

router.post('/show-with-character', ctx => {
    const type = ctx.request.body?.type
    const token = ctx.request.body?.token

    if (type === '') {
        putline(`show`)
        ctx.redirect('/show')
    } else if (type === 'name') {
        putline(`show -name="${token}"`)
        ctx.redirect('/show')
    } else if (type === 'author') {
        putline(`show -author="${token}"`)
        ctx.redirect('/show')
    } else if (type === 'ISBN') {
        putline(`show -ISBN=${token}`)
        ctx.redirect('/show')
    } else if (type === 'keyword') {
        putline(`show -keyword="${token}"`)
        ctx.redirect('/show')
    }
})

router.post('/buy', async ctx => {
    const ISBN = ctx.request.body?.ISBN
    const quantity = ctx.request.body?.quantity
    putline(`buy ${ISBN} ${quantity}`)
    const result = await getline()
    if (result === 'Invalid') {
        ctx.body = `
        <html>
            <head>
                <meta charset="UTF-8">
                <link rel="stylesheet" href="styles.css">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>User - Bookstore</title>
            </head>
            <body>
                <main>
                    <nav>
                        <span>Hello, ${ID}!</span>
                        <a href="/">Main page</a>
                        <a href="/show-single">Find book</a>
                        <a href="/change-password">Change password</a>
                        <a href="/logout">Logout</a>
                    </nav>
                    <h3>Sorry, something gets wrong.</h3>
                    <h5>go back to<a href="/">main page</a></h5>
                </main>
            </body>
        </html>
        `
    } else {
        ctx.body = `
        <html>
            <head>
                <meta charset="UTF-8">
                <link rel="stylesheet" href="styles.css">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>User - Bookstore</title>
            </head>
            <body>
                <main>
                    <nav>
                        <span>Hello, ${ID}!</span>
                        <a href="/">Main page</a>
                        <a href="/show-single">Find book</a>
                        <a href="/change-password">Change password</a>
                        <a href="/logout">Logout</a>
                    </nav>
                    <h3>You spent $${result}.</h3>
                    <h5>go back to<a href="/">main page</a></h5>
                </main>
            </body>
        </html>
        `
    }

})

router.get('/login', async ctx => {
    ID = ''
    priority = 0
    ctx.redirect('/')
})

app.listen(8080)
