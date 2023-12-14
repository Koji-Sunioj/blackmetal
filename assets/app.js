const checkSession = async () => {
  const navBar = document.getElementById("nav");
  const anchor = document.createElement("a");
  const {
    location: { pathname: uri },
  } = window;

  try {
    const loginToken = document.cookie.match(/token=(.*$)/)[1];
    const jwtPayload = JSON.parse(atob(loginToken.split(".")[1]));
    if (jwtPayload["iat"] > Number(new Date())) {
      throw new Error("expired token");
    }
    anchor.setAttribute("href", "/my-account");
    anchor.innerText = "My account";

    switch (uri) {
      case "/my-account":
        await renderUser(jwtPayload["sub"], loginToken);
        break;
    }
  } catch (error) {
    anchor.setAttribute("href", "/sign-in");
    anchor.innerText = "Sign in";
  }
  switch (uri) {
    case "/sign-in":
      renderSignIn();
      break;
    case "/albums":
      renderAlbums();
      break;
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

const renderAlbums = async () => {
  const url = `/api/albums`;
  const response = await fetch(url);
  const { albums } = await response.json();

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
};

const logOut = () => {
  document.cookie = "token=; Max-Age=0; path=/; domain=" + location.host;
};

const renderSignIn = () => {
  document.querySelector("h1").innerHTML = "Sign In";
  const nodes = ["a", "br"].map((tag) => document.createElement(tag));
  const anchor = nodes.find((node) => node.tagName === "A");
  anchor.setAttribute("href", "/register");
  anchor.innerText = "don't have an account? sign up!";
  const form = document.getElementById("form_id");
  nodes.forEach((node) => {
    form.after(node);
  });
  form.setAttribute("onsubmit", "return signIn(event)");
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

const signIn = async (event) => {
  event.preventDefault();
  const {
    target: {
      username: { value: username },
      password: { value: password },
    },
  } = event;
  const url = "/api/sign-in";

  const response = await fetch(url, {
    body: JSON.stringify({ username: username, password: password }),
    method: "POST",
  });

  const { status } = response;
  const { detail, token } = await response.json();
  alert(detail);
  if (status == 200) {
    const {
      location: { href: uri },
    } = window;
    document.cookie = `token=${token}`;
    window.location.replace(uri.replace("/sign-in", "/"));
  }
};

const signUp = async (event) => {
  event.preventDefault();
  const {
    target: {
      username: { value: username },
      password: { value: password },
    },
  } = event;
  const url = "/api/register";
  const response = await fetch(url, {
    body: JSON.stringify({ username: username, password: password }),
    method: "POST",
  });
  const { status } = response;
  const { detail } = await response.json();

  alert(detail);

  if (status === 200) {
    const {
      location: { href: uri },
    } = window;
    window.location.replace(uri.replace("/register", "/"));
  }
};

/*  const url = "/api/check-token";
    const response = await fetch(url, { body: loginTOken, method: "POST" });
    const { status } = response;

    switch (status) {
      case 200:
        anchor.setAttribute("href", "/my-account");
        anchor.innerText = "My account";
        break;
      case 401:
        anchor.setAttribute("href", "/sign-in");
        anchor.innerText = "Sign in";
        break;
    } */
