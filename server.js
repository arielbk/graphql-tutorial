var express = require('express');
var graphqlHTTP = require('express-graphql');
var { buildSchema } = require('graphql');

// Constructing a schema using GraphQL schema language
var schema = buildSchema(`
  type Query {
    hello: String
  }
`);

// Defining the root to provide a resolver fn for each API endpoint
var root = {
  hello: () => {
    return 'Hello world!';
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
console.log(`Running a GraphQL API server at
http://localhost:4000/graphql`);