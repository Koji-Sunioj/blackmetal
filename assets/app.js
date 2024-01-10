//render functions

const checkSession = async () => {
  const {
    location: { pathname: uri },
  } = window;

  let refinedURI = "";

  if (uri.includes("artist")) {
    refinedURI += uri.includes("album")
      ? uri.replace(/(?<=\/artist)\/.+\/.+/, "-album")
      : uri.replace(/(?<=\/artist)\/.[^\/]*$/, "");
  } else {
    refinedURI += uri;
  }

  const { user, token } = checkToken();

  switch (refinedURI) {
    case "/register":
    case "/sign-in":
      renderAuthForm(uri);
      break;
    case "/albums":
      const {
        location: { search },
      } = window;
      const url = new URLSearchParams(search);
      const page = url.get("page"),
        sort = url.get("sort"),
        direction = url.get("direction"),
        query = url.get("query");
      const shouldRedirect = [page, sort, direction].some(
        (param) => param === null
      );
      if (shouldRedirect) {
        url.set("page", "1");
        url.set("sort", "name");
        url.set("direction", "ascending");
        window.location.search = url;
      } else {
        renderAlbums(page, sort, direction, query);
      }
      break;
    case "/artist":
      renderArtist(uri);

      break;
    case "/artist-album":
      renderAlbum(uri, token);
      break;
    case "/my-account":
      renderUser(user, token);
      break;
  }

  const navBar = document.getElementById("nav");
  const anchor = document.createElement("a");

  if (user !== null && token !== null) {
    anchor.setAttribute("href", "/my-account");
    anchor.innerText = "My account";
  } else {
    anchor.setAttribute("href", "/sign-in");
    anchor.innerText = "Sign in";
  }
  navBar.appendChild(anchor);
};

const createElements = (tags) => {
  const tagsObj = {};
  tags.forEach((tag) => {
    const { name, type } = tag;
    tagsObj[name] = document.createElement(type);
  });
  return tagsObj;
};

const renderArtist = async (uri) => {
  const artist = uri.split("/")[2];
  const url = `/api/artist/${artist}`;
  const response = await fetch(url);
  const {
    artist: { name, albums, bio },
  } = await response.json();

  const h1 = document.querySelector("h1");
  h1.innerText = name;
  const artistP = document.getElementById("bio");
  artistP.innerText = bio;

  renderAlbumTiles(albums);
};

const renderAlbums = async (page, sort, direction, query) => {
  const searchParam = query === null ? "" : `&query=${query}`;
  const url = `/api/albums?page=${page}&sort=${sort}&direction=${direction}${searchParam}`;

  document.querySelector("[name='query']").value = query;
  document.querySelector("[name='direction']").value = direction;
  document.querySelector("[name='sort']").value = sort;

  const response = await fetch(url);
  const { albums, pages } = await response.json();

  renderAlbumTiles(albums);

  const pageDiv = document.getElementById("pages");
  [...Array(pages).keys()].forEach((dbPage) => {
    const htmlRef = dbPage + 1;
    const pageUrl = `albums?page=${htmlRef}&sort=${sort}&direction=${direction}${searchParam}`;
    const anchor = document.createElement("a");
    anchor.setAttribute("href", pageUrl);
    anchor.innerHTML = htmlRef;
    pageDiv.appendChild(anchor);
    if (htmlRef !== pages) {
      pageDiv.append(",");
    }
  });
};

const renderAlbum = async (uri, token) => {
  const noSpaces = uri.replace(/%20/g, " ");
  const artistPattern = /(?<=artist\/)[\D\d]+(?=\/album)/,
    albumPattern = /(?<=album\/)[\D\d]+/;
  const artist_name = noSpaces.match(artistPattern)[0],
    album_title = noSpaces.match(albumPattern)[0];

  const url = `/api/albums/${artist_name}/${album_title}`;

  const response = await fetch(url);
  const { album, songs } = await response.json();

  document.title += ` ${album.name} - ${album.title}`;

  const { salesBtn, artistA } = createElements([
    { name: "salesBtn", type: "button" },
    { name: "artistA", type: "a" },
  ]);

  const image = document.getElementById("album-img");

  image.src = `/common/${album.photo}`;
  image.classList.add("album-img");

  const infoDiv = document.getElementById("info-div");

  const paragraphs = Object.keys(album)
    .filter((info) => info !== "photo")
    .map((info) => {
      const text = info.split("_").join(" ");
      const paragraph = document.createElement("p");
      paragraph.classList.add("album-p");
      if (info === "name") {
        paragraph.innerText = `${text}: `;
        artistA.setAttribute("href", `/artist/${toUrlCase(album[info])}`);
        artistA.innerText = album[info];
        paragraph.appendChild(artistA);
      } else {
        paragraph.innerText = `${text}: ${album[info]}`;
      }
      return paragraph;
    });

  paragraphs.reverse().forEach((item) => {
    infoDiv.prepend(item);
  });

  const table = document.getElementById("songs-table");

  songs.forEach((dbSong) => {
    const row = document.createElement("tr");
    Object.keys(dbSong).forEach((item) => {
      if (dbSong[item] !== null) {
        let text = "";
        switch (item) {
          case "track":
            text = `${dbSong[item]}. `;
            break;
          case "duration":
            const slice = dbSong[item] >= 600 ? 14 : 15;
            text = `${new Date(dbSong[item] * 1000)
              .toISOString()
              .slice(slice, 19)}`;
            break;
          case "song":
            text = `${dbSong[item]}`;
            break;
        }
        const td = document.createElement("td");
        td.innerText = text;
        row.appendChild(td);
      }
    });

    table.appendChild(row);
  });

  if (token !== null && album.stock > 0) {
    salesBtn.innerText = "Buy album";
    salesBtn.onclick = () => {
      buyAlbum(token);
    };
    infoDiv.appendChild(salesBtn);
  }
};

const renderAuthForm = (uri) => {
  let h1text = "";
  switch (uri) {
    case "/register":
      h1text = "Register as new user";
      break;
    case "/sign-in":
      h1text = "Sign In";
      const nodes = ["a", "br"].map((tag) => document.createElement(tag));
      const anchor = nodes.find((node) => node.tagName === "A");
      anchor.setAttribute("href", "/register");
      anchor.innerText = "don't have an account? sign up!";
      const form = document.getElementById("form_id");
      nodes.forEach((node) => {
        form.after(node);
      });
      break;
  }

  document.querySelector("h1").innerHTML = h1text;
};

const renderUser = async (username, token) => {
  const url = `/api/users/${username}`;
  const request = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const { user } = await request.json();
  const targetDiv = document.getElementById("details");
  Object.keys(user).forEach((param) => {
    const pElement = document.createElement("p");
    if (param.includes("created")) {
      pElement.innerText = `${param}: ${user[param].substring(0, 10)} ${user[
        param
      ].substring(11, 16)}`;
    } else {
      pElement.innerText = `${param}: ${user[param]}`;
    }

    targetDiv.appendChild(pElement);
  });
};

//misc functions

const renderAlbumTiles = (albums) => {
  const albumsDiv = document.getElementById("albums");
  albums.forEach((album) => {
    const { title, name, photo } = album;
    const { targetDiv, anchor, image } = createElements([
      { name: "targetDiv", type: "div" },
      { name: "anchor", type: "a" },
      { name: "image", type: "img" },
    ]);

    const paragraphs = Object.keys(album)
      .filter((info) => ["release_year", "stock", "price"].includes(info))
      .map((info) => {
        const text = info.split("_").join(" ");
        const paragraph = document.createElement("p");
        paragraph.classList.add("album-p");
        paragraph.innerText = `${text}: ${album[info]}`;
        return paragraph;
      });

    targetDiv.classList.add("albums-div");
    const albumUri = `/artist/${toUrlCase(name)}/album/${toUrlCase(title)}`;
    anchor.setAttribute("href", albumUri);
    anchor.innerText = `${name} - ${title}`;
    image.src = `/common/${photo}`;
    image.classList.add("albums-img");

    [image, anchor, ...paragraphs].forEach((item) => {
      targetDiv.appendChild(item);
    });

    albumsDiv.appendChild(targetDiv);
  });
};

const toUrlCase = (value) => {
  return value.toLowerCase().replace(/\s/g, "-");
};

const buyAlbum = (token) => {
  alert(token);
};

const checkToken = () => {
  try {
    const loginToken = document.cookie.match(/token=(.*$)/)[1];
    const jwtPayload = JSON.parse(atob(loginToken.split(".")[1]));
    if (jwtPayload["iat"] > Number(new Date())) {
      throw new Error("expired token");
    }
    return { user: jwtPayload["sub"], token: loginToken };
  } catch (error) {
    return { user: null, token: null };
  }
};

const submitQuery = (event) => {
  event.preventDefault();
  const {
    location: { search },
  } = window;
  const {
    target: {
      sort: { value: sort },
      query: { value: query },
      direction: { value: direction },
    },
  } = event;

  const url = new URLSearchParams(search);
  url.set("sort", sort);
  url.set("direction", direction);

  if (query.length > 0 && url.get("query") !== query) {
    url.set("query", query);
    url.set("page", "1");
  } else if (query.length === 0 && url.get("query") !== null) {
    url.delete("query");
  }

  window.location.search = url;
};

const logOut = () => {
  document.cookie = "token=; Max-Age=0; path=/; domain=" + location.host;
};

const auth = async (event) => {
  event.preventDefault();
  const {
    target: {
      username: { value: username },
      password: { value: password },
    },
  } = event;

  const {
    location: { pathname: uri },
  } = window;
  const url = `/api${uri}`;

  const response = await fetch(url, {
    body: JSON.stringify({ username: username, password: password }),
    method: "POST",
  });

  const { status } = response;
  const { detail, token } = await response.json();
  alert(detail);

  if (uri === "/sign-in") document.cookie = `token=${token}`;
  status === 200 && window.location.replace(uri.replace(uri, "/"));
};
