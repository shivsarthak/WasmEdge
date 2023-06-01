const getFilesFromGitUrl = async (repoUrl) => {
    const [_, __, ___, userName, repoName] = repoUrl.split('/')
    const url = `https://api.github.com/repos/${userName}/${repoName}/contents`
    const files = {}
    const response = await fetch(url)
    const data = await response.json()
    for (const file of data) {
        if(file.type !== 'file') continue
        const data = await fetch(file.download_url)
        files[file.name] = {
            file: {
                contents: await data.text()
            }
        }
    }
    return files
}

export default getFilesFromGitUrl;

// const urlParams = new URLSearchParams(window.location.search); 
// const myParam = urlParams.get('github');
// if(!myParam) {}