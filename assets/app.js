const checkSession = async () => {
  const {
    location: { pathname: uri },
  } = window;

  const refinedURI =
    uri.includes("/album") && uri.includes("/artist") ? "/artist-album" : uri;
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

const checkToken = () => {
  try {
    const loginToken = document.cookie.match(/token=(.*$)/)[1];
    const jwtPayload = JSON.parse(atob(loginToken.split(".")[1]));
    if (jwtPayload["iat"] > Number(new Date())) {
      throw new Error("expired token");
    }
    return { user: jwtPayload["sub"], token: loginToken };
  } catch (error) {
    console.log(error);
    return { user: null, token: null };
  }
};

const renderAlbum = async (uri, token) => {
  const noSpaces = uri.replace(/%20/g, " ");
  const artistPattern = /(?<=artist\/)[\D\d]+(?=\/album)/,
    albumPattern = /(?<=album\/)[\D\d]+/;
  const artist_name = noSpaces.match(artistPattern)[0],
    album_title = noSpaces.match(albumPattern)[0];

  const url = `/api/albums/${artist_name}/${album_title}`;

  const response = await fetch(url);
  const {
    album: { title, name, release_year, photo, stock, price },
  } = await response.json();

  const {
    artistA,
    artistP,
    releaseP,
    stockP,
    priceP,
    image,
    salesBtn,
    albumP,
  } = createElements([
    { name: "salesBtn", type: "button" },
    { name: "artistA", type: "a" },
    { name: "artistP", type: "p" },
    { name: "albumP", type: "p" },
    { name: "releaseP", type: "p" },
    { name: "stockP", type: "p" },
    { name: "priceP", type: "p" },
    { name: "image", type: "img" },
  ]);

  image.src = `/common/${photo}`;
  image.classList.add("album-img");
  const albumDiv = document.getElementById("album");
  albumDiv.appendChild(image);

  artistA.setAttribute("href", `/artist/${name}`);
  artistA.innerText = name;

  artistP.innerText = "artist: ";
  artistP.appendChild(artistA);
  albumP.innerText = `title: ${title}`;
  releaseP.innerText = `release year: ${release_year}`;
  priceP.innerText = `price: ${price}`;
  stockP.innerText = `stock: ${stock}`;

  const elements = [artistP, albumP, releaseP, priceP, stockP];

  if (token !== null) {
    salesBtn.innerText = "Buy album";
    salesBtn.onclick = () => {
      buyAlbum(token);
    };
    elements.push(salesBtn);
  }

  const infoDiv = document.getElementById("info-div");
  elements.forEach((item) => {
    infoDiv.appendChild(item);
  });

  albumDiv.appendChild(infoDiv);
};

const buyAlbum = (token) => {
  alert(token);
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

const createElements = (tags) => {
  const tagsObj = {};
  tags.forEach((tag) => {
    const { name, type } = tag;
    tagsObj[name] = document.createElement(type);
  });
  return tagsObj;
};

const renderAlbums = async (page, sort, direction, query) => {
  const searchParam = query === null ? "" : `&query=${query}`;
  const url = `/api/albums?page=${page}&sort=${sort}&direction=${direction}${searchParam}`;

  document.querySelector("[name='query']").value = query;
  document.querySelector("[name='direction']").value = direction;
  document.querySelector("[name='sort']").value = sort;

  const response = await fetch(url);
  const { albums, pages } = await response.json();

  const albumsDiv = document.getElementById("albums");
  albums.forEach((album) => {
    const { title, name, release_year, photo, stock, price } = album;
    const { targetDiv, anchor, releaseP, stockP, priceP, image, br } =
      createElements([
        { name: "br", type: "br" },
        { name: "targetDiv", type: "div" },
        { name: "anchor", type: "a" },
        { name: "releaseP", type: "p" },
        { name: "stockP", type: "p" },
        { name: "priceP", type: "p" },
        { name: "image", type: "img" },
      ]);

    targetDiv.classList.add("albums-div");
    const albumUri = `/artist/${name}/album/${title}`;
    anchor.setAttribute("href", albumUri);
    anchor.innerText = `${name} - ${title}`;
    releaseP.innerText = `release year: ${release_year}`;
    priceP.innerText = `price: ${price}`;
    stockP.innerText = `stock: ${stock}`;
    image.src = `/common/${photo}`;

    [image, br, anchor, releaseP, priceP, stockP].forEach((item) => {
      targetDiv.appendChild(item);
    });

    albumsDiv.appendChild(targetDiv);
  });

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

const logOut = () => {
  document.cookie = "token=; Max-Age=0; path=/; domain=" + location.host;
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
