# Bongo
![This is an image](https://github.com/b06608062/Bongo/blob/master/demo_image/截圖%202022-01-16%20下午2.36.27.png)

## Demo
[Demo Link](https://www.youtube.com/watch?v=i_phRIS7DYs)

## Deploy
[Deploy Link](https://bongo-cha-cha.herokuapp.com/)

## Introduction
Bongo is a facebook-like online social media which provide a platform for users to interact with each other. 

## Main function
* Users **sign up** and **log in**.
* Backend **password encryption** by bcrypt.
* Frontend **save user_id** by local storage.
* Allow users to **stay logged in**.
* Can **send friend request**、**accept friend request** or **reject friend request**.
* Can **write post**、**edit post** or **delete post**.
* Can **like**、**unlike**、**comment** or **uncomment** on post.
* Support three post modes: **public**、**friends** and  **private**
* Can **create chatroom**、**add room members** and **customize room name** or **leave chatroom**.
* Can **send message** or **delete message** in chatroom.
* Support three chatroom types: **self**、**one2one** and **many2many**
* Support **new message informing**、**chatroom switching** and **notifications**.
* Can **update info**、**upload profile picture** or **visit someone's homepage**.

## Framework/Packages
* **Frontend:** React, apollo, Material-UI, Ant Design, uuid, moment, react-router-dom, graphql, moment, Cookie, XML
* **Backend:** bcrypt, cors, dotenv-defaults, express, uuid, apollo-server-express, mongoose
* Imgur API

## Software Architecture

### Frontend
```
.
└── index.js
    ├── graphql
    │   ├── index.js
    │   ├── mutations.js
    │   ├── queries.js
    │   └── subscriptions.js
    ├── constants.js
    ├── displayStatus.js
    └── App.js
        ├── signIn.js
        └── Bongo.js
            ├── me.js
            ├── visit.js
            ├── posts.js
            │   └── post.js
            └── chatRoom.js
                └── room.js
```                

### Backend
```
.
└── server.js
    ├── mongo.js
    ├── models.js
    │   ├── User
    │   ├── ChatRoom
    │   └── Post
    ├── resolvers.js
    │   ├── mutations.js
    │   ├── queries.js
    │   └── subscriptions.js
    └── schema.graphql
```

## Run in local
1. Download and install packages.
```
git clone https://github.com/b06608062/Bongo.git
cd ./Bongo
yarn install
yarn build
```
2. Add `.env` file and fill it(You can refer to [.env.defaults](https://github.com/b06608062/Bongo/blob/master/.env.defaults)).
3. Run `yarn start`.
4. Open [http://localhost:80](http://localhost:80) to view it in the browser.
