var express = require('express');
var graphqlHTTP = require('express-graphql');
var { buildSchema } = require('graphql');

// Constructing a schema using GraphQL schema language
var schema = buildSchema(`
  type RandomDie {
    numSides: Int!
    rollOnce: Int!
    roll(numRolls: Int!): [Int]
  }

  input MessageInput {
    content: String
    author: String
  }

  type Message {
    id: ID!
    content: String
    author: String
  }

  type Query {
    quoteOfTheDay: String
    random: Float!
    getDie(numSides: Int): RandomDie
    getMessage(id: ID!): Message
  }

  type Mutation {
    createMessage(input: MessageInput): Message
    updateMessage(id: ID!, input: MessageInput): Message
  }
`);
// Three scalar types: String, Int, Float, Boolean and ID
// By default, all types can be null, ! makes them non nullable

class RandomDie {
  constructor(numSides) {
    this.numSides = numSides;
  }

  rollOnce() {
    return 1 + Math.floor(Math.random() * this.numSides);
  }

  roll({ numRolls }) {
    var output = [];
    for (var i = 0; i < numRolls; i++) {
      output.push(this.rollOnce());
    }
    return output;
  }
}

class Message {
  constructor(id, { content, author }) {
    this.id = id;
    this.content = content;
    this.author = author;
  }
}

// Root provides a resolver fn for each API endpoint
// For object types it provides the top-level API endpoints
// Database for db mutation
var fakeDatabase = {};
var root = {
  quoteOfTheDay: () => {
    return Math.random() < 0.5 ? 'With great power comes great responsibility' : 'The early bird gets the worm';
  },
  random: () => {
    return Math.random();
  },
  // When a resolver takes args, they are passed as one object - easy to destructure
  // rollDice: function ({ numDice, numSides }) {
  //   var output = [];
  //   for (var i = 0; i < numDice; i++) {
  //     output.push(1 + Math.floor(Math.random() * numSides || 6));
  //   }
  //   return output;
  // }
  getDie: function ({ numSides }) {
    return new RandomDie(numSides || 6);
  },
  getMessage: function ({ id }) {
    if (!fakeDatabase[id]) {
      throw new Error('no message exists with id ' + id);
    }
    return new Message(id, fakeDatabase[id]);
  },
  createMessage: function ({ input }) {
    // Create random id for the fake db
    var id = require('crypto').randomBytes(10).toString('hex');

    fakeDatabase[id] = input;
    return new Message(id, input);
  },
  updateMessage: function ({ id, input }) {
    if (!fakeDatabase[id]) {
      throw new Error('no message exists with id ' + id);
    }
    // Replaces all data
    fakeDatabase[id] = input;
    return new Message(id, input);
  },
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

// // This is some client logic for injecting variables into a mutation
var author = 'arielbk';
var content = 'hope is a good thing';
var query = `mutation CreateMessage($input: MessageInput) {
  createMessage(input: $input) {
    id
  }
}`;

fetch('/graphql', {
  method: 'POST',
  // had a bug here while learning... header_s_
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: JSON.stringify({
    query,
    variables: {
      input: {
        author,
        content,
      }
    }
  })
})
  .then(res => res.json())
  .then(data => console.log('Data returned: ', data));
