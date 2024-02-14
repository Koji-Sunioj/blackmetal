//render functions

const checkSession = async () => {
  const {
    location: { pathname: uri, search },
  } = window;

  const [, basePath, secondPath] = uri.split("/");

  const { user, token } = await checkToken();

  switch (basePath) {
    case "register":
    case "sign-in":
      renderAuthForm(uri);
      break;
    case "albums":
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
    case "artist":
      const pattern = /^\/artist\/.+\/album\/.+$/;
      const hasAlbum = pattern.test(uri);
      hasAlbum ? renderAlbum(uri, token) : renderArtist(uri);
      break;
    case "my-account":
      secondPath === "orders"
        ? renderOrders(user, token)
        : renderUser(user, token);
      break;
  }
};

const renderOrders = async (user, token) => {
  const url = `/api/orders/${user}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const { orders, cart } = await response.json();

  const targetDiv = document.getElementById("details");

  if (cart.length > 0) {
    const cartHeader = element("h2");
    cartHeader.innerText = "Cart";
    targetDiv.appendChild(cartHeader);

    cart.forEach((cartItem) => {
      Object.keys(cartItem)
        .filter((item) => item === "balance")
        .forEach((key) => {
          console.log(key);
          const paragraph = element("p");
          paragraph.innerText = `${key}: ${cartItem[key]}`;
          targetDiv.appendChild(paragraph);
        });

      const { albums } = cartItem;
      const table = renderAlbumTable(albums);
      targetDiv.appendChild(table);
    });
  }

  if (cart.length > 0 && orders.length > 0) {
    const lineBr = element("hr");
    targetDiv.appendChild(lineBr);
  }

  if (orders.length > 0) {
    const orderHeader = element("h2");
    orderHeader.innerText = "Dispatched orders";
    targetDiv.appendChild(orderHeader);

    orders.forEach((order) => {
      Object.keys(order)
        .filter((item) => ["order id", "dispatched", "balance"].includes(item))
        .forEach((key) => {
          const paragraph = element("p");
          paragraph.innerText = `${key}: ${
            key === "dispatched" && order[key] !== null
              ? new Date(order[key]).toLocaleString()
              : order[key]
          }`;
          targetDiv.appendChild(paragraph);
        });

      const { albums } = order;
      const table = renderAlbumTable(albums);
      targetDiv.appendChild(table);
    });
  }
};

const renderAlbumTable = (albums) => {
  const [table, tableHeaderRow] = elements(["table", "tr"]);

  table.classList.add("dispatched-table");

  ["cover", "title", "artist", "quantity", "price"].forEach((header) => {
    const td = element("td");
    td.innerText = header;
    tableHeaderRow.appendChild(td);
  });

  table.appendChild(tableHeaderRow);

  albums.forEach((album) => {
    const row = element("tr");

    Object.keys(album).forEach((key) => {
      const td = element("td");
      switch (key) {
        case "artist":
        case "title":
          const tdA = element("a");
          const albumUri =
            key === "artist"
              ? `/artist/${toUrlCase(album["artist"])}`
              : `/artist/${toUrlCase(album["artist"])}/album/${toUrlCase(
                  album["title"]
                )}`;
          tdA.setAttribute("href", albumUri);
          tdA.innerText = album[key];
          td.appendChild(tdA);
          break;
        case "photo":
          const image = element("img");
          image.src = `/common/${album[key]}`;
          image.classList.add("table-img");
          td.appendChild(image);
          break;
        default:
          td.innerText = album[key];
      }
      row.appendChild(td);
    });
    table.appendChild(row);
  });

  return table;
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
    const anchor = element("a");
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

  const params =
    token !== null
      ? {
          headers: { Authorization: `Bearer ${token}` },
        }
      : {};

  const response = await fetch(url, params);
  const { album, songs, cart } = await response.json();

  document.title += ` ${album.name} - ${album.title}`;

  const [salesBtn, artistA] = elements(["button", "a"]);

  const image = document.getElementById("album-img");

  image.src = `/common/${album.photo}`;
  image.classList.add("album-img");

  const infoDiv = document.getElementById("info-div");

  const paragraphs = Object.keys(album)
    .filter((info) => !["photo", "cart"].includes(info))
    .map((info) => {
      const text = info.split("_").join(" ");
      const paragraph = element("p");
      paragraph.classList.add("album-p");

      switch (info) {
        case "album_id":
          break;
        case "name":
          paragraph.innerText = `${text}: `;
          artistA.setAttribute("href", `/artist/${toUrlCase(album[info])}`);
          artistA.innerText = album[info];
          paragraph.appendChild(artistA);
          break;
        case "stock":
          const span = element("span");
          span.innerText = album[info];
          span.id = "stock-p";
          paragraph.innerText = `${text}: `;
          paragraph.appendChild(span);
          break;
        default:
          paragraph.innerText = `${text}: ${album[info]}`;
          break;
      }

      return paragraph;
    });

  paragraphs.reverse().forEach((item) => {
    infoDiv.prepend(item);
  });

  const table = document.getElementById("songs-table");

  songs.forEach((dbSong) => {
    const row = element("tr");
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
        const td = element("td");
        td.innerText = text;
        row.appendChild(td);
      }
    });

    table.appendChild(row);
  });

  if (token !== null) {
    salesBtn.innerText = "Add to cart";

    if (album.stock <= 0) {
      salesBtn.disabled = true;
      salesBtn.classList.add("disabled-button");
    }

    salesBtn.id = "buy-album";
    salesBtn.onclick = () => {
      buyAlbum(token, album.album_id);
    };
    infoDiv.appendChild(salesBtn);

    if (cart > 0) {
      
      const cartInfo = element("i");
      cartInfo.id = "cart-info"
      cartInfo.innerText = `${cart} of these albums are in your cart.`;
      cartInfo.style.display ="block";

      const removeBtn = element("button");
      removeBtn.innerText = "Remove from cart";
      removeBtn.id = "remove-button"
      infoDiv.appendChild(removeBtn);
      infoDiv.appendChild(cartInfo);
    }
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
      const nodes = ["a", "br"].map((tag) => element(tag));
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

  Object.keys(user)
    .filter((detail) => detail !== "orders" && detail !== "cart")
    .forEach((param) => {
      const pElement = element("p");
      if (param.includes("created")) {
        pElement.innerText = `${param}: ${user[param].substring(0, 10)} ${user[
          param
        ].substring(11, 16)}`;
      } else {
        pElement.innerText = `${param}: ${user[param]}`;
      }

      targetDiv.appendChild(pElement);
    });

  const { orders, cart } = user;

  console.log(orders, cart);

  if (orders > 0 || cart > 0) {
    const existingHref = document.getElementById("log-out");

    const [newHref, newLine] = elements(["a", "br"]);

    const ordersString =
      orders > 0
        ? cart > 0
          ? `${orders} dispatched,`
          : `${orders} dispatched`
        : "";
    const cartString = cart > 0 ? `${cart} in cart` : "";

    newHref.setAttribute("href", "/my-account/orders");
    newHref.innerText = `Your orders: ${ordersString} ${cartString}`;
    newHref.style.paddingTop = "10px";
    newHref.style.display = "inline-block";

    existingHref.insertAdjacentElement("afterend", newHref);
    existingHref.insertAdjacentElement("afterend", newLine);
  }
};

//misc functions

const elements = (params) => {
  return params.map((param) => document.createElement(param));
};

const element = (param) => {
  return document.createElement(param);
};

const createElements = (tags) => {
  const tagsObj = {};
  tags.forEach((tag) => {
    const { name, type } = tag;
    tagsObj[name] = document.createElement(type);
  });
  return tagsObj;
};

const renderAlbumTiles = (albums) => {
  const albumsDiv = document.getElementById("albums");
  albums.forEach((album) => {
    const { title, name, photo } = album;
    const [targetDiv, anchor, image] = elements(["div", "a", "img"]);

    const paragraphs = Object.keys(album)
      .filter((info) => ["release_year", "stock", "price"].includes(info))
      .map((info) => {
        const text = info.split("_").join(" ");
        const paragraph = element("p");
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

const buyAlbum = async (token, album_id) => {
  const salesBtn = document.getElementById("buy-album");
  salesBtn.disabled = true;

  const url = `/api/cart/${album_id}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const { status } = response;
  const { remaining } = await response.json();


  switch (status) {
    case 200:
      const stockP = document.getElementById("stock-p");
      stockP.innerText = String(remaining);

      if (remaining === 0) {
        salesBtn.disabled = true;
        salesBtn.classList.add("disabled-button");

      } else {
        salesBtn.disabled = false;
      }

      alert("this album has been added to your cart");
      break;
  }
};

const checkToken = async () => {
  const navBar = document.getElementById("nav");
  const anchor = element("a");

  try {
    const loginToken = document.cookie.match(/token=(.*$)/)[1];
    const jwtPayload = JSON.parse(atob(loginToken.split(".")[1]));

    jwtPayload["iat"] > Number(new Date());

    if (jwtPayload["iat"] > Number(new Date())) {
      throw new Error("expired token");
    }

    if (jwtPayload["sub"] !== null) {
      anchor.setAttribute("href", "/my-account");
      anchor.innerText = "My account";
      navBar.appendChild(anchor);
      return { user: jwtPayload["sub"], token: loginToken };
    } else {
      throw new Error("empty credentials");
    }
  } catch (error) {
    anchor.setAttribute("href", "/sign-in");
    anchor.innerText = "Sign in";
    navBar.appendChild(anchor);
    logOut();
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
