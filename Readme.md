# Re:Hash Backend


## TO DO

- 500 error on new user return



## GraphQL Queries

```


    mutation{
        updateProfile(
            _id: "5ec51d0c0bf28661ab5aa60b"
            bio: "Test bio from GraphiQL 10"
          	email:null
        ){
            _id
            avatar
            name
            email
            bio
        }
    }



   mutation{
        getOrCreateUser(
            auth0Id:"auth0|5ec133025830a90c6fe9834d"
            name: "Test 2"
            avatar: ""
            email: "test@domain.com"
        ){
        	name
        }
    }



-----
mutation{
    getOrCreateUser(
        auth0Id: "auth0|5ec133025830a90c6fe9834d"
        name: ""
        avatar: ""
        email: ""
    ){
        name
        avatar
        email
        level
        id
        score
        bonus
        bio
    }
}

query{
    getUserById(id: "5ec4101af74e2a84a07eb805"){
            name
            avatar
            email
            level
            id
    }
}


mutation{
    updateProfile(){
        _id: "5ec4101af74e2a84a07eb805"
        auth0Id: "auth0|5ec133025830a90c6fe9834d"
        bio: "This is my test bio"
    }
    name
    avatar
    email
    bio
}


mutation{
  createUser(
    auth0Id: "auth0|5ec133025830a90c6fe9834d"
    name: "TestMcTesterson"
    avatar: "https://placekitten.com/200/200?img=2"
    email: "email@domain.com"
  ){
    name
    avatar
    email
    level
    id
  }
}

mutation{
  updateUser(
  	id: "5eb9e6e53f73f934095e7999"
    name: "Mark Arenz2",
  ){
    name
    avatar
    email
    level
    id
  }
}

mutation{
  destroyUser(
  	id: "5eb9e6973f73f934095e7998"
  ){
    name
  }
}

mutation{
  createPost(
    content: "Test2",
    tags:"test",
    userID:"5eb9e6e53f73f934095e7999"
  ){
    content
    tags
    user {
      id
      name
    }
  }
}



```

