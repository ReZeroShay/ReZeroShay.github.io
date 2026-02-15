const CONFIG = {
  username: "ReZeroShay",
  perPage: 100,
  excludeForks: true,//排除fork
  excludeArchived: true,//排除存档
  topic : "cheat" //项目 topic必须包含该topic
};

document.getElementById("year").textContent = new Date().getFullYear();

const popularList = document.getElementById("popularList");
const recentList = document.getElementById("recentList");
const popularFoot = document.getElementById("popularFoot");
const recentFoot = document.getElementById("recentFoot");

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function setLoading(node) {
  node.innerHTML = "";
  node.appendChild(el("div", "skeleton", "Loading…"));
}

function setUserAvatar() {
    const avatar = document.querySelector(".avatar");
    avatar.style.backgroundImage =`url("https://github.com/${CONFIG.username}.png")`;
}

function setError(node, msg) {
  node.innerHTML = "";
  node.appendChild(el("div", "skeleton", msg));
}

function fmtDaysAgo(iso) {
  const d = new Date(iso);
  const diff = Math.max(0, Date.now() - d.getTime());
  const days = Math.floor(diff / 86400000);

  if (days === 0) return "今天";
  if (days === 1) return "1 天前";
  if (days < 7) return `${days} 天前`;

  const w = Math.floor(days / 7);
  if (w < 5) return `${w} 周前`;

  const m = Math.floor(days / 30);
  return `${m} 个月前`;
}

function metaItem(iconClass, text) {
  const span = document.createElement("span");
  span.className = "meta";

  const icon = document.createElement("i");
  icon.className = iconClass;

  span.appendChild(icon);
  span.append(" " + text);
  return span;
}

function metaDot() {
  const dot = document.createElement("span");
  dot.className = "metaDot";
  dot.textContent = "·";
  return dot;
}

function repoCard(repo, extraMeta = [], showSpark = false) {
  const card = el("div", "repoCard");

  const top = el("div", "repoTop");
  const left = el("div");

  const name = el("div", "repoName", repo.name);
  const desc = el("div", "repoDesc", repo.description || "No description.");
  left.appendChild(name);
  left.appendChild(desc);

  const link = document.createElement("a");
  link.className = "repoLink";
  link.href = repo.html_url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.setAttribute("aria-label", "Open repository");
  link.title = "Open on GitHub";

  const icon = document.createElement("i");
  icon.className = "fa-solid fa-arrow-up-right-from-square";
  link.appendChild(icon);

  const downloadLink = document.createElement("a");
  downloadLink.className = "repoLink";
  downloadLink.href = repo.html_url + "/releases";
  downloadLink.target = "_blank";
  downloadLink.rel = "noreferrer";
  downloadLink.setAttribute("aria-label", "Open repository");
  downloadLink.title = "下载";

  const downloadicon = document.createElement("i");
  downloadicon.className = "fa-solid fa-download";
  downloadLink.appendChild(downloadicon);

  const right = el("div", "repoActions");
  right.appendChild(link);
  right.appendChild(downloadLink);

  top.appendChild(left);
  top.appendChild(right);

  const meta = el("div", "repoMeta");

  if (repo.language) meta.appendChild(el("span", "chip", repo.language));

  meta.appendChild(metaItem("fa-solid fa-star", repo.stargazers_count ?? 0));
  meta.appendChild(metaDot());
  meta.appendChild(metaItem("fa-solid fa-code-fork", repo.forks_count ?? 0));

const updated = metaItem(
  "fa-regular fa-clock",
  `更新于 ${fmtDaysAgo(repo.pushed_at || repo.updated_at)}`
);
updated.classList.add("metaUpdated");
meta.appendChild(updated);

  for (const m of extraMeta) meta.appendChild(metaItem("fa-solid fa-circle-info", m));

  card.appendChild(top);
  card.appendChild(meta);

  if (showSpark) card.appendChild(el("div", "sparkline"));
  return card;
}

async function fetchRepos() {
  const url = `https://api.github.com/users/${encodeURIComponent(CONFIG.username)}/repos?per_page=${CONFIG.perPage}&sort=pushed`;
  const r = await fetch(url, { headers: { "Accept": "application/vnd.github.mercy-preview+json" } });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

function applyFilters(repos) {
  return repos.filter(r => {
    if (CONFIG.excludeForks && r.fork) return false;
    if (CONFIG.excludeArchived && r.archived) return false;
    if (! r.topics.some(t => t.toLowerCase().includes(CONFIG.topic))) return false;
    return true;

  });
}


async function main() {
//   setLoading(popularList);
  setLoading(recentList);
  setUserAvatar();

  try {
    let repos = await fetchRepos();
    //筛选出符合要求的仓库
    repos = applyFilters(repos);

    const recent = [...repos]
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
      ;

    recentList.innerHTML = "";
    for (const r of recent) recentList.appendChild(repoCard(r, [], false));
    recentFoot.textContent = "\n Ranked by last commit.";

    const popular = [...repos]
      .sort((a, b) => {
        const ds = (b.stargazers_count || 0) - (a.stargazers_count || 0);
        if (ds !== 0) return ds;
        return new Date(b.pushed_at) - new Date(a.pushed_at);
      })
     ;

    // popularList.innerHTML = "";
    // for (const r of popular) popularList.appendChild(repoCard(r, [], false));
    // popularFoot.textContent = "\n Ranked by star count.";
  } catch (e) {
    setError(popularList, `Error: ${e.message}`);
    setError(recentList, `Error: ${e.message}`);
    popularFoot.textContent = "";
    recentFoot.textContent = "";
  }
}

main();
