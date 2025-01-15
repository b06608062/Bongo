import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  GET_ME_QUERY,
  GET_POST_QUERY,
  GET_ROOM_QUERY,
  PUBLIC_USER_SUBSCRIPTION,
  ME_SUBSCRIPTION,
  ACCEPT_REQUEST_MUTATION,
  REJECT_REQUEST_MUTATION,
  UPDATE_NOTIFICATIONS_VIEW_TIME_MUTATION,
  ROOM_SUBSCRIPTION,
  PUBLIC_POST_SUBSCRIPTION,
  POST_SUBSCRIPTION,
  ADD_FRIEND_MUTATION,
} from "./graphql";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { useApolloClient } from "@apollo/client";
import styled from "styled-components";
import moment from "moment";
import ChatRooms from "./chatRooms";
import Posts from "./posts";
import Me from "./me";
import Visit from "./visit";
import displayStatus from "./displayStatus";
import { Button, Drawer, Layout, Spin } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import {
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Typography,
  Tooltip,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import HomeIcon from "@mui/icons-material/Home";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import SearchIcon from "@mui/icons-material/Search";
import LogoutIcon from "@mui/icons-material/Logout";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import { gql } from "@apollo/client";

const { Header } = Layout;

const NotificationDrawer = styled(Drawer)`
  top: 56px;
  height: 92%;
  left: auto;
  .ant-drawer-header {
    padding: 16px 12px;
  }
  .ant-drawer-title {
    font-size: 24px;
    font-weight: bolder;
  }
  .ant-drawer-body {
    padding: 0;
  }
  @media screen and (max-height: 350px) {
    display: none;
  }
`;

const MyHeader = styled(Header)`
  @media screen and (max-height: 220px) {
    #search-button {
      display: none;
    }
    #add-friend-button {
      display: none;
    }
    #my-friend-button {
      display: none;
    }
    #message-button {
      display: none;
    }
    #notification-button {
      display: none;
    }
    #log-out-button {
      margin-left: auto;
    }
    #game-button {
      display: none;
    }
  }
`;

const LoadBox = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const countUnreadNotifications = (notificationsViewTime, notifications) => {
  const base = new Date(notificationsViewTime).getTime();
  const count = notifications.findIndex((notification) => {
    const timestamp = new Date(notification.timestamp).getTime();
    return timestamp - base <= 0;
  });
  if (count === -1) {
    return notifications.length;
  }
  return count;
};

const countUnreadMessages = (ROOM) => {
  let count = 0;
  ROOM.room.forEach(({ messages, viewTime }) => {
    const base = new Date(viewTime).getTime();
    let idx = messages.length - 1;
    while (
      idx >= 0 &&
      new Date(messages[idx--].timestamp).getTime() - base > 0
    ) {
      count++;
    }
  });
  return count;
};

const getCookie = (name) => {
  let arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
  if (arr != null) return unescape(arr[2]);
  return null;
};

const delCookie = (name) => {
  let exp = new Date();
  exp.setTime(exp.getTime() - 1);
  let cval = getCookie(name);
  if (cval != null)
    document.cookie = name + "=" + cval + ";expires=" + exp.toGMTString();
};

const Bongo = ({ me, setOnline }) => {
  const navigate = useNavigate();
  const client = useApolloClient();
  const { data: ME, subscribeToMore: SUBME } = useQuery(GET_ME_QUERY, {
    variables: { query: me },
  });
  const { data: ROOM, subscribeToMore: SUBROOM } = useQuery(GET_ROOM_QUERY, {
    variables: { query: me },
  });
  const {
    data: POST,
    subscribeToMore: SUBPOST,
    refetch: REFETCHPOST,
    loading,
  } = useQuery(GET_POST_QUERY, { variables: { query: me } });
  const [anchorSearch, setAnchorSearch] = useState(null);
  const [anchorAddFriend, setAnchorAddFriend] = useState(null);
  const [anchorMyFriend, setAnchorMyFriend] = useState(null);
  const [openNotificationDrawer, setOpenNotificationDrawer] = useState(false);
  const [acceptRequest] = useMutation(ACCEPT_REQUEST_MUTATION);
  const [rejectRequest] = useMutation(REJECT_REQUEST_MUTATION);
  const [updateNotificationsViewTime] = useMutation(
    UPDATE_NOTIFICATIONS_VIEW_TIME_MUTATION,
    { variables: { query: me } }
  );
  const [activeRoom, setActiveRoom] = useState(null);
  const [addFriend] = useMutation(ADD_FRIEND_MUTATION);
  const [wait, setWait] = useState(false);

  useEffect(() => {
    SUBME({
      document: PUBLIC_USER_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const {
          publicUser: { mutation, data },
        } = subscriptionData.data;
        switch (mutation) {
          case "NEW_USER_CREATED": {
            return {
              me: {
                ...prev.me,
                users: {
                  usersList: [...prev.me.users.usersList, data.userName],
                  headShotURLs: {
                    ...prev.me.users.headShotURLs,
                    [data.userName]: "",
                  },
                },
              },
            };
          }
          case "HEAD_SHOT_UPDATED": {
            const { userName, headShotURL, headShotUpdateTime } = data;
            if (userName === me) {
              return {
                me: {
                  ...prev.me,
                  users: {
                    usersList: prev.me.users.usersList,
                    headShotURLs: {
                      ...prev.me.users.headShotURLs,
                      [userName]: headShotURL,
                    },
                  },
                  headShotURL,
                  headShotUpdateTime,
                },
              };
            } else {
              return {
                me: {
                  ...prev.me,
                  users: {
                    usersList: prev.me.users.usersList,
                    headShotURLs: {
                      ...prev.me.users.headShotURLs,
                      [userName]: headShotURL,
                    },
                  },
                },
              };
            }
          }
        }
      },
    });
  }, [SUBME]);

  useEffect(() => {
    SUBPOST({
      document: PUBLIC_POST_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const {
          publicPost: { mutation, data },
        } = subscriptionData.data;
        switch (mutation) {
          case "POST_CREATED": {
            return {
              post: [data.post, ...prev.post],
            };
          }
          case "POST_DELETED": {
            return {
              post: [
                ...prev.post.filter(({ postId }) => postId !== data.postId),
              ],
            };
          }
          case "COMMENT_CREATED": {
            return {
              post: [
                ...prev.post.map((post) => {
                  if (post.postId !== data.postId) {
                    return post;
                  } else {
                    return {
                      ...post,
                      comments: [...post.comments, data.comment],
                    };
                  }
                }),
              ],
            };
          }
          case "COMMENT_DELETED": {
            return {
              post: [
                ...prev.post.map((post) => {
                  if (post.postId !== data.postId) {
                    return post;
                  } else {
                    return {
                      ...post,
                      comments: [
                        ...post.comments.filter(
                          ({ commentId }) => commentId !== data.commentId
                        ),
                      ],
                    };
                  }
                }),
              ],
            };
          }
          case "LIKE": {
            return {
              post: [
                ...prev.post.map((post) => {
                  if (post.postId !== data.postId) {
                    return post;
                  } else {
                    return { ...post, likes: [...post.likes, data.userName] };
                  }
                }),
              ],
            };
          }
          case "UNLIKE": {
            return {
              post: [
                ...prev.post.map((post) => {
                  if (post.postId !== data.postId) {
                    return post;
                  } else {
                    return {
                      ...post,
                      likes: [
                        ...post.likes.filter((like) => like !== data.userName),
                      ],
                    };
                  }
                }),
              ],
            };
          }
          default:
        }
      },
    });
  }, [SUBPOST]);

  useEffect(() => {
    SUBPOST({
      document: POST_SUBSCRIPTION,
      variables: { query: me },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const {
          post: { mutation, data },
        } = subscriptionData.data;
        switch (mutation) {
          case "POST_CREATED": {
            return {
              post: [data.post, ...prev.post],
            };
          }
          case "POST_UPDATED": {
            return {
              post: [
                ...prev.post.map((post) => {
                  if (post.postId !== data.post.postId) {
                    return post;
                  } else {
                    return data.post;
                  }
                }),
              ],
            };
          }
          default:
        }
      },
    });
  }, [SUBPOST]);

  useEffect(() => {
    SUBME({
      document: ME_SUBSCRIPTION,
      variables: { query: me },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const { me } = subscriptionData.data;
        switch (me.mutation) {
          case "FRIEND_ADDED_FROM": {
            return {
              me: {
                ...prev.me,
                requests: [...prev.me.requests, me.data.to],
                notifications: [me.data.notification, ...prev.me.notifications],
              },
            };
          }
          case "FRIEND_ADDED_TO": {
            return {
              me: {
                ...prev.me,
                invitations: [...prev.me.invitations, me.data.from],
                notifications: [me.data.notification, ...prev.me.notifications],
              },
            };
          }
          case "FRIEND_ACCEPTED_FROM": {
            REFETCHPOST();
            return {
              me: {
                ...prev.me,
                invitations: [
                  ...prev.me.invitations.filter(
                    (invitation) => invitation !== me.data.to
                  ),
                ],
                notifications: [me.data.notification, ...prev.me.notifications],
                friends: [...prev.me.friends, me.data.to],
              },
            };
          }
          case "FRIEND_ACCEPTED_TO": {
            REFETCHPOST();
            return {
              me: {
                ...prev.me,
                requests: [
                  ...prev.me.requests.filter(
                    (request) => request !== me.data.from
                  ),
                ],
                notifications: [me.data.notification, ...prev.me.notifications],
                friends: [...prev.me.friends, me.data.from],
              },
            };
          }
          case "FRIEND_REJECTED_FROM": {
            return {
              me: {
                ...prev.me,
                invitations: [
                  ...prev.me.invitations.filter(
                    (invitation) => invitation !== me.data.to
                  ),
                ],
                notifications: [me.data.notification, ...prev.me.notifications],
              },
            };
          }
          case "FRIEND_REJECTED_TO": {
            return {
              me: {
                ...prev.me,
                requests: [
                  ...prev.me.requests.filter(
                    (request) => request !== me.data.from
                  ),
                ],
                notifications: [me.data.notification, ...prev.me.notifications],
              },
            };
          }
          case "NOTIFICATIONS_VIEW_TIME_UPDATED": {
            return {
              me: {
                ...prev.me,
                notificationsViewTime: me.data.notificationsViewTime,
              },
            };
          }
          case "NOTIFICATIONS_UPDATED": {
            return {
              me: {
                ...prev.me,
                notifications: [me.data.notification, ...prev.me.notifications],
              },
            };
          }
          case "INFO_UPDATED": {
            return {
              me: {
                ...prev.me,
                ...me.data,
              },
            };
          }
          default:
        }
      },
    });
  }, [SUBME]);

  useEffect(() => {
    SUBROOM({
      document: ROOM_SUBSCRIPTION,
      variables: { query: me },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const { mutation, data } = subscriptionData.data.room;
        switch (mutation) {
          case "ROOM_CREATED": {
            return {
              room: [data, ...prev.room],
            };
          }
          case "MESSAGE_SENT": {
            if (data.sender === me) {
              displayStatus({ type: "success", msg: "Message Sent." });
              return {
                room: [
                  ...prev.room.map((room) => {
                    if (room.roomId !== data.roomId) {
                      return room;
                    } else {
                      return {
                        ...room,
                        messages: [
                          ...room.messages,
                          {
                            sender: data.sender,
                            messageId: data.messageId,
                            text: data.text,
                            timestamp: data.timestamp,
                          },
                        ],
                        viewTime: new Date(),
                      };
                    }
                  }),
                ],
              };
            } else {
              displayStatus({ type: "info", msg: "New Message." });
              return {
                room: [
                  ...prev.room.map((room) => {
                    if (room.roomId !== data.roomId) {
                      return room;
                    } else {
                      return {
                        ...room,
                        messages: [
                          ...room.messages,
                          {
                            sender: data.sender,
                            messageId: data.messageId,
                            text: data.text,
                            timestamp: data.timestamp,
                          },
                        ],
                      };
                    }
                  }),
                ],
              };
            }
          }
          case "ROOM_LEFT": {
            return {
              ...prev,
              room: [
                ...prev.room.filter((room) => room.roomId !== data.roomId),
              ],
            };
          }
          case "ROOM_MEMBER_LEFT": {
            return {
              room: [
                ...prev.room.map((room) => {
                  if (room.roomId !== data.roomId) {
                    return room;
                  } else {
                    return {
                      ...room,
                      members: [
                        ...room.members.filter(
                          (member) => member !== data.userName
                        ),
                      ],
                      messages: [...room.messages, data.sysMsg],
                    };
                  }
                }),
              ],
            };
          }
          case "MESSAGES_VIEW_TIME_UPDATED": {
            return {
              room: [
                ...prev.room.map((room) => {
                  if (room.roomId !== data.roomId) {
                    return room;
                  } else {
                    return { ...room, viewTime: data.viewTime };
                  }
                }),
              ],
            };
          }
          case "MESSAGE_DELETED": {
            return {
              room: [
                ...prev.room.map((room) => {
                  if (room.roomId !== data.roomId) {
                    return room;
                  } else {
                    return {
                      ...room,
                      messages: [
                        ...room.messages.map((message) => {
                          if (message.messageId !== data.messageId) {
                            return message;
                          } else {
                            return data.sysMsg;
                          }
                        }),
                      ],
                    };
                  }
                }),
              ],
            };
          }
          case "ROOM_MEMBER_ADDED": {
            return {
              room: [
                ...prev.room.map((room) => {
                  if (room.roomId !== data.roomId) {
                    return room;
                  } else {
                    return {
                      ...room,
                      members: [...room.members, data.to],
                      messages: [...room.messages, data.sysMsg],
                      viewTime: data.from === me ? new Date() : room.viewTime,
                    };
                  }
                }),
              ],
            };
          }
          default:
        }
      },
    });
  }, [SUBROOM]);

  useEffect(() => {
    let id = null;
    if (openNotificationDrawer) {
      id = setTimeout(() => {
        updateNotificationsViewTime();
      }, 5000);
      return () => {
        clearTimeout(id);
      };
    }
  }, [ME]);

  const handleOpenNotificationDrawer = () => {
    setOpenNotificationDrawer(!openNotificationDrawer);
    updateNotificationsViewTime();
    client.writeQuery({
      query: gql`
        query WriteTodo($query: ID!) {
          me(query: $query) {
            userName
            birthday
            from
            liveIn
            school
            email
            phone
            instagram
            website
            about
            github
            position
            company
            friends
            requests
            invitations
            headShotURL
            headShotUpdateTime
            notifications
            notificationsViewTime
            users {
              usersList
              headShotURLs
            }
          }
        }
      `,
      data: {
        // Contains the data to write
        me: {
          ...ME.me,
          notificationsViewTime: new Date(),
        },
      },
      variables: {
        query: me,
      },
    });
  };

  const handleWait = (time) => {
    setWait(true);
    setTimeout(() => setWait(false), time * 1000);
  };

  return (
    <>
      {ME && ROOM && POST && !wait ? (
        <>
          <Layout style={{ width: "100%", height: "100vh" }}>
            <MyHeader>
              <AppBar sx={{ bgcolor: "#081165", zIndex: 990 }}>
                <Toolbar sx={{ overflow: "auto" }}>
                  <Tooltip title="Home Page" placement="bottom">
                    <IconButton
                      size="large"
                      color="inherit"
                      onClick={() => {
                        navigate("/");
                        REFETCHPOST();
                      }}
                    >
                      <HomeIcon />
                    </IconButton>
                  </Tooltip>

                  <IconButton
                    size="large"
                    color="inherit"
                    id="search-button"
                    onClick={(event) => setAnchorSearch(event.currentTarget)}
                  >
                    <SearchIcon />
                  </IconButton>

                  <IconButton
                    size="large"
                    color="inherit"
                    id="add-friend-button"
                    onClick={(event) => setAnchorAddFriend(event.currentTarget)}
                  >
                    <Badge
                      badgeContent={ME.me.invitations.length}
                      color="error"
                    >
                      <PersonAddAlt1Icon />
                    </Badge>
                  </IconButton>

                  <IconButton
                    size="large"
                    color="inherit"
                    id="my-friend-button"
                    onClick={(event) => setAnchorMyFriend(event.currentTarget)}
                  >
                    <PeopleAltIcon />
                  </IconButton>

                  <IconButton
                    size="large"
                    color="inherit"
                    sx={{ ml: "auto" }}
                    onClick={() => navigate("/me")}
                  >
                    <Avatar src={ME.me.headShotURL} />
                  </IconButton>

                  <Tooltip title="Game" placement="bottom">
                    <IconButton
                      size="large"
                      color="inherit"
                      id="game-button"
                      sx={{ ml: "auto" }}
                      href="https://b06608062.github.io/SPACE_WAR/SPACE_WAR.html"
                      target="_blank"
                    >
                      <SportsEsportsIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Messages" placement="bottom">
                    <IconButton
                      size="large"
                      color="inherit"
                      id="message-button"
                      onClick={() => navigate("/rooms")}
                    >
                      <Badge
                        badgeContent={countUnreadMessages(ROOM)}
                        color="error"
                      >
                        <MessageOutlined style={{ fontSize: "1.5rem" }} />
                      </Badge>
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Notifications" placement="bottom">
                    <IconButton
                      size="large"
                      color="inherit"
                      id="notification-button"
                      onClick={handleOpenNotificationDrawer}
                    >
                      <Badge
                        badgeContent={
                          openNotificationDrawer
                            ? 0
                            : countUnreadNotifications(
                                ME.me.notificationsViewTime,
                                ME.me.notifications
                              )
                        }
                        color="error"
                      >
                        <NotificationsIcon />
                      </Badge>
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Log Out" placement="bottom">
                    <IconButton
                      size="large"
                      color="inherit"
                      id="log-out-button"
                      onClick={() => {
                        delCookie(me);
                        setOnline(false);
                        client.clearStore();
                        navigate("/");
                      }}
                    >
                      <LogoutIcon />
                    </IconButton>
                  </Tooltip>
                </Toolbar>

                <Menu
                  id="search-menu"
                  anchorEl={anchorSearch}
                  open={Boolean(anchorSearch)}
                  onClose={() => setAnchorSearch(null)}
                  PaperProps={{
                    style: {
                      maxHeight: 234,
                      minWidth: "20ch",
                      maxWidth: "30ch",
                    },
                  }}
                >
                  {
                    <h2
                      style={{
                        fontSize: "1rem",
                        paddingLeft: "16px",
                        fontWeight: "bolder",
                      }}
                    >
                      所有使用者
                    </h2>
                  }
                  {ME.me.users.usersList.map((userName) => {
                    if (userName !== me)
                      return (
                        <MenuItem
                          key={userName}
                          onClick={() => {
                            setAnchorSearch(null);
                            navigate(`visits/${userName}`);
                          }}
                        >
                          <Avatar
                            sx={{ width: "36px", height: "36px", mr: "6px" }}
                            src={ME.me.users.headShotURLs[userName]}
                          />
                          <Typography variant="inherit" noWrap>
                            {userName}
                          </Typography>
                        </MenuItem>
                      );
                  })}
                </Menu>

                <Menu
                  id="add-friend-menu"
                  anchorEl={anchorAddFriend}
                  open={Boolean(anchorAddFriend)}
                  onClose={() => setAnchorAddFriend(null)}
                  PaperProps={{ style: { maxHeight: 186, width: "30ch" } }}
                >
                  {
                    <h2
                      style={{
                        fontSize: "1rem",
                        paddingLeft: "16px",
                        fontWeight: "bolder",
                      }}
                    >
                      收到的交友邀請
                    </h2>
                  }
                  {ME.me.invitations.map((invitation) => (
                    <MenuItem
                      key={invitation}
                      sx={{
                        displayRaw: "flex",
                        justifyContent: "space-around",
                        cursor: "default",
                      }}
                    >
                      <div
                        style={{
                          textAlign: "center",
                          fontSize: 15,
                          width: "60px",
                        }}
                      >
                        <Avatar
                          sx={{ margin: "auto", cursor: "pointer" }}
                          src={ME.me.users.headShotURLs[invitation]}
                          onClick={() => {
                            navigate(`visits/${invitation}`);
                            setAnchorAddFriend(false);
                          }}
                        />{" "}
                        <Typography variant="inherit" noWrap>
                          {invitation}
                        </Typography>
                      </div>
                      <Button
                        onClick={() => {
                          acceptRequest({
                            variables: { from: me, to: invitation },
                          });
                          setAnchorAddFriend(false);
                        }}
                      >
                        接受
                      </Button>
                      <Button
                        onClick={() => {
                          rejectRequest({
                            variables: { from: me, to: invitation },
                          });
                          setAnchorAddFriend(false);
                        }}
                      >
                        拒絕
                      </Button>
                    </MenuItem>
                  ))}
                </Menu>

                <Menu
                  id="my-friend-menu"
                  anchorEl={anchorMyFriend}
                  open={Boolean(anchorMyFriend)}
                  onClose={() => setAnchorMyFriend(null)}
                  PaperProps={{ style: { maxHeight: 234, width: "20ch" } }}
                >
                  {
                    <h2
                      style={{
                        fontSize: "1rem",
                        paddingLeft: "16px",
                        fontWeight: "bolder",
                      }}
                    >
                      我的朋友
                    </h2>
                  }
                  {ME.me.friends.map((friend) => (
                    <MenuItem
                      key={friend}
                      onClick={() => {
                        setAnchorMyFriend(null);
                        navigate(`visits/${friend}`);
                      }}
                    >
                      <Avatar
                        sx={{ width: "36px", height: "36px", mr: "6px" }}
                        src={ME.me.users.headShotURLs[friend]}
                      />
                      <Typography variant="inherit" noWrap>
                        {friend}
                      </Typography>
                    </MenuItem>
                  ))}
                </Menu>

                <NotificationDrawer
                  title="Notifications"
                  placement="right"
                  onClose={handleOpenNotificationDrawer}
                  visible={openNotificationDrawer}
                  mask={false}
                  style={{ width: openNotificationDrawer ? 300 : 0 }}
                >
                  <List
                    sx={{ bgcolor: "background.paper", width: "100%" }}
                    component="nav"
                    aria-label="mailbox folders"
                  >
                    {ME.me.notifications.map(({ info, timestamp }) => (
                      <ListItem button divider key={timestamp}>
                        <ListItemText
                          primary={info}
                          secondary={moment(timestamp).fromNow()}
                        />
                      </ListItem>
                    ))}
                  </List>
                </NotificationDrawer>
              </AppBar>
            </MyHeader>
            <Layout>
              <Routes>
                <Route
                  path="/"
                  element={
                    <Posts
                      navigate={navigate}
                      me={me}
                      POST={POST}
                      home={true}
                      headShotURLs={ME.me.users.headShotURLs}
                      handleWait={handleWait}
                    />
                  }
                  visit={false}
                />
                <Route
                  path="/rooms"
                  element={
                    <ChatRooms
                      navigate={navigate}
                      me={me}
                      ME={ME}
                      ROOM={ROOM}
                      activeRoom={activeRoom}
                      setActiveRoom={setActiveRoom}
                      handleWait={handleWait}
                    />
                  }
                />
                <Route
                  path="/me"
                  element={
                    <Me
                      navigate={navigate}
                      me={me}
                      ME={ME}
                      POST={{
                        post: POST.post.filter((post) => post.author === me),
                      }}
                      headShotURLs={ME.me.users.headShotURLs}
                      handleWait={handleWait}
                    />
                  }
                />
                <Route
                  path="/visits/:visit"
                  element={
                    <Visit
                      navigate={navigate}
                      me={me}
                      ME={ME}
                      POST={POST}
                      headShotURLs={ME.me.users.headShotURLs}
                      acceptRequest={acceptRequest}
                      addFriend={addFriend}
                      handleWait={handleWait}
                    />
                  }
                />
              </Routes>
            </Layout>
          </Layout>
        </>
      ) : (
        <>
          <LoadBox>
            <Spin size="large" tip="Loading..." />
          </LoadBox>
        </>
      )}
    </>
  );
};

export default Bongo;
