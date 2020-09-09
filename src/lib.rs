use eyre::{bail, Result};
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

mod git;

pub struct Repository {
    local_path: PathBuf,
}

impl Repository {
    pub fn local_path(&self) -> &PathBuf {
        &self.local_path
    }

    pub fn update(&mut self, _credentials: &Credentials) -> Result<()> {
        todo!()
    }
}

pub struct Credentials {}

impl Credentials {
    pub fn new() -> Credentials {
        Credentials {}
    }
}

pub struct Cache {
    directory: PathBuf,
}

impl Cache {
    pub fn new<P: AsRef<Path>>(directory: P) -> Cache {
        Cache {
            directory: directory.as_ref().to_path_buf(),
        }
    }

    /// Open or create an existing local repository to cache `upstream`.
    pub async fn open(&mut self, upstream: &str) -> Result<Repository> {
        let mut local_path = self.directory.clone();
        local_path.push(upstream);
        if !matches!(local_path.extension(), Some(ext) if ext.to_str() == Some("git")) {
            local_path.set_extension("git");
        }

        match fs::metadata(&local_path) {
            Err(e) if e.kind() == io::ErrorKind::NotFound => {
                git::init_bare(&local_path).await?;
            }
            Ok(x) if x.is_dir() => {
                if local_path.read_dir().unwrap().next().is_none() {
                    git::init_bare(&local_path).await?;
                } else {
                    // assume it's a repository; later git calls will fail if it isn't, but at
                    // least we didn't pollute an unrelated directory
                }
            }
            _ => bail!("Directory exists but is not a repository: {:?}", local_path),
        }

        Ok(Repository { local_path })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile;

    #[tokio::test]
    async fn smoke_test() {
        let dir = tempfile::tempdir().unwrap();
        let mut cache = Cache::new(&dir);

        let repo = cache.open("example.com/foo/bar").await.unwrap();

        assert_eq!(
            repo.local_path().as_os_str(),
            dir.path().join("example.com/foo/bar.git").as_os_str()
        );

        assert!(repo.local_path().join("HEAD").is_file());

        // let credentials = Credentials::new();

        // let mut repo = cache.open("github.com/jonasmalacofilho/git-cache-http-server").unwrap();
        // assert_eq!(repo.update(&credentials), Ok(()));

        // repo.serve_upload_pack();

        // repo.serve_receive_pack();
    }

    #[tokio::test]
    async fn opens_existing_repository() {
        let dir = tempfile::tempdir().unwrap();
        let mut cache = Cache::new(&dir);

        cache.open("example.com/foo/bar.git").await.unwrap();

        assert!(cache.open("example.com/foo/bar.git").await.is_ok());
    }

    #[tokio::test]
    async fn opens_in_empty_directory() {
        const EXAMPLE_REPOSITORY: &str = "example.com/foo/bar.git";
        use std::fs;

        let dir = tempfile::tempdir().unwrap();
        let mut cache = Cache::new(&dir);

        fs::create_dir_all(dir.path().join(EXAMPLE_REPOSITORY)).unwrap();

        assert!(cache.open(EXAMPLE_REPOSITORY).await.is_ok());
        assert!(dir.path().join(EXAMPLE_REPOSITORY).join("HEAD").is_file());
    }
}

// Global FIXMEs/TODOs:
// - validate the local paths
// - include git output in errors that come from git
// - delete branches and tags from the cache as they are deleted on upstream
// - only accept https URLs since they are the only one we can provide credentials to
// - make sure no server credentials are used as a fallback to missing/invalid user credentials

/// Mess from previous attempt (will eventually be removed)
pub mod first_attempt;
