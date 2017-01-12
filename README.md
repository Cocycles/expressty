expressty
===================
Express middleware kit for writing easy RESTful services with express
```

const app = require('express')();
const expressty = require('expressty');

app.use(expressty);

app.get('/anakin', (req, res) => fightObiWan().then(res.ok).fail(res.error));

/**
 * Respond if nothing was found
 */
app.use((req, res) => res.notFound());
```
    
A **GET** request on */anakin* , will yield the following response:
```
{
	"code": 200,
	"message": "ok",
	"payload": "i win"
}
```

A **POST** request on */anakin* , will yield the following response:
```
{
	"code": 404,
	"message": "resource not found",
	"payload": null
}
```
