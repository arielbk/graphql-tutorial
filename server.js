var express = require('express');
var graphqlHTTP = require('express-graphql');
var { buildSchema } = require('graphql');

// Constructing a schema using GraphQL schema language
var schema = buildSchema(`
  type Query {
    quoteOfTheDay: String
    random: Float!
    rollDice(numDice: Int!, numSides: Int): [Int]
  }
`);
// Three scalar types: String, Int, Float, Boolean and ID
// By default, all types can be null, ! makes them non nullable

// Root provides a resolver fn for each API endpoint
var root = {
  quoteOfTheDay: () => {
    return Math.random() < 0.5 ? 'With great power comes great responsibility' : 'The early bird gets the worm';
  },
  random: () => {
    return Math.random();
  },
  // When a resolver takes args, they are passed as one object - easy to destructure
  rollDice: function ({ numDice, numSides }) {
    var output = [];
    for (var i = 0; i < numDice; i++) {
      output.push(1 + Math.floor(Math.random() * numSides || 6));
    }
    return output;
  }
};

// This is where express comes in
var app = express();
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));
app.listen(4000);
console.log(`Running a GraphQL API server at http://localhost:4000/graphql`);

/*
_A client side query_
notice how the variables are passed in using $ syntax in graphql
that way, we don't have to worry about escaping these vars client side

var dice = 3;
var sides = 6;
var query = `query RollDice($dice: Int!, $sides: Int) {
  rollDice(numDice: $dice, numSides: $sides)
}`;

fetch('/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: JSON.stringify({
    query,
    variables: { dice, sides },
  })
})
  .then(r => r.json())
  .then(data => console.log('data returned:', data));
*/